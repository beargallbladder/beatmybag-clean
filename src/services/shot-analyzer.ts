import { OpenAI } from 'openai';
import { createHash } from 'crypto';

interface ShotMetrics {
  ballSpeed: number;
  launchAngle: number;
  spinRate: number;
  carry: number;
  total: number;
  club?: string;
  confidence: number;
}

interface ExtractedText {
  text: string;
  confidence: number;
}

interface AnalyzerOptions {
  userRole: 'free' | 'pro' | 'dealer';
  forceHighAccuracy?: boolean;
}

export class ShotAnalyzer {
  private openai: OpenAI;
  private cache = new Map<string, ShotMetrics>();
  
  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async analyze(imageBuffer: Buffer, options: AnalyzerOptions = { userRole: 'free' }): Promise<ShotMetrics> {
    // Check cache first
    const hash = this.hashImage(imageBuffer);
    const cached = this.cache.get(hash);
    if (cached) return cached;

    let metrics: ShotMetrics;

    // For dealers, we use a more sophisticated approach
    if (options.userRole === 'dealer') {
      metrics = await this.dealerAnalysis(imageBuffer);
    } else {
      metrics = await this.standardAnalysis(imageBuffer);
    }

    // Cache the result
    this.cache.set(hash, metrics);
    
    return metrics;
  }

  // Standard analysis for free/pro users
  private async standardAnalysis(imageBuffer: Buffer): Promise<ShotMetrics> {
    // Step 1: Try OCR extraction (cheap)
    const ocrText = await this.performOCR(imageBuffer);
    let partialMetrics = this.extractWithRegex(ocrText.text);

    // Step 2: If incomplete, use GPT-4o-mini
    let metrics: ShotMetrics;
    if (!this.isComplete(partialMetrics)) {
      metrics = await this.extractWithAI(imageBuffer, ocrText.text, 'gpt-4o-mini');
    } else {
      // Convert partial to full metrics
      metrics = {
        ballSpeed: partialMetrics.ballSpeed!,
        launchAngle: partialMetrics.launchAngle!,
        spinRate: partialMetrics.spinRate!,
        carry: partialMetrics.carry!,
        total: partialMetrics.total!,
        confidence: 0.9
      };
    }

    // Step 3: Infer club
    metrics.club = this.inferClub(metrics);
    
    return metrics;
  }

  // Premium analysis for dealers with fallback to better models
  private async dealerAnalysis(imageBuffer: Buffer): Promise<ShotMetrics> {
    // Step 1: Try OCR with better model
    const ocrText = await this.performOCR(imageBuffer, true);
    let partialMetrics = this.extractWithRegex(ocrText.text);

    // Step 2: Use GPT-4o-mini first (still cost-efficient)
    if (!this.isComplete(partialMetrics)) {
      const miniMetrics = await this.extractWithAI(imageBuffer, ocrText.text, 'gpt-4o-mini');
      
      // Step 3: If confidence is low, escalate to GPT-4o (the good stuff!)
      if (miniMetrics.confidence < 0.85 || !this.isComplete(miniMetrics)) {
        console.log('Escalating to GPT-4o for dealer accuracy');
        const gpt4Metrics = await this.extractWithAI(imageBuffer, ocrText.text, 'gpt-4o');
        
        // Step 4: If still not perfect, try GPT-4 Vision (the premium model)
        if (gpt4Metrics.confidence < 0.95) {
          console.log('Using GPT-4 Vision for maximum accuracy');
          return await this.extractWithPremiumVision(imageBuffer);
        }
        
        return gpt4Metrics;
      }
      
      return miniMetrics;
    }

    // Convert partial to full metrics
    const metrics: ShotMetrics = {
      ballSpeed: partialMetrics.ballSpeed!,
      launchAngle: partialMetrics.launchAngle!,
      spinRate: partialMetrics.spinRate!,
      carry: partialMetrics.carry!,
      total: partialMetrics.total!,
      confidence: 0.95
    };

    metrics.club = this.inferClub(metrics);
    return metrics;
  }

  private hashImage(buffer: Buffer): string {
    return createHash('md5').update(buffer).digest('hex');
  }

  private async performOCR(imageBuffer: Buffer, useHighQuality: boolean = false): Promise<ExtractedText> {
    try {
      const base64 = imageBuffer.toString('base64');
      const model = useHighQuality ? 'gpt-4o' : 'gpt-4o-mini';
      
      const response = await this.openai.chat.completions.create({
        model,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'Extract all text from this golf shot monitor image. Return only the raw text, no formatting.' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } }
          ]
        }],
        max_tokens: 200,
        temperature: 0
      });

      return {
        text: response.choices[0]?.message?.content || '',
        confidence: useHighQuality ? 0.95 : 0.8
      };
    } catch (error) {
      console.error('OCR failed:', error);
      return { text: '', confidence: 0 };
    }
  }

  private extractWithRegex(text: string): Partial<ShotMetrics> {
    const metrics: Partial<ShotMetrics> = {};
    
    // Enhanced regex patterns for better extraction
    const patterns = {
      ballSpeed: /(?:ball\s*speed|velocity|BS)[:\s]*(\d+(?:\.\d+)?)\s*(?:mph|MPH)?/i,
      launchAngle: /(?:launch\s*angle|launch|LA|vert\s*angle)[:\s]*(\d+(?:\.\d+)?)\s*(?:deg|degrees|°)?/i,
      spinRate: /(?:spin\s*rate|spin|rpm|RPM|SR)[:\s]*(\d+(?:\.\d+)?)\s*(?:rpm|RPM)?/i,
      carry: /(?:carry\s*distance|carry|CRY)[:\s]*(\d+(?:\.\d+)?)\s*(?:yds|yards|YDS)?/i,
      total: /(?:total\s*distance|total|TOT)[:\s]*(\d+(?:\.\d+)?)\s*(?:yds|yards|YDS)?/i,
    };

    for (const [key, pattern] of Object.entries(patterns)) {
      const match = text.match(pattern);
      if (match) {
        metrics[key as keyof ShotMetrics] = parseFloat(match[1]);
      }
    }

    return metrics;
  }

  private isComplete(metrics: Partial<ShotMetrics>): boolean {
    return !!(
      metrics.ballSpeed &&
      metrics.launchAngle &&
      metrics.spinRate &&
      metrics.carry &&
      metrics.total
    );
  }

  private async extractWithAI(imageBuffer: Buffer, ocrText: string, model: string): Promise<ShotMetrics> {
    const base64 = imageBuffer.toString('base64');
    
    const prompt = `Extract golf shot metrics from this image. 
    OCR found: "${ocrText}"
    
    Return JSON with these exact numeric fields:
    - ballSpeed (mph)
    - launchAngle (degrees) 
    - spinRate (rpm)
    - carry (yards)
    - total (yards)
    
    Only return the JSON object, no other text.`;

    try {
      const response = await this.openai.chat.completions.create({
        model,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } }
          ]
        }],
        max_tokens: 150,
        temperature: 0,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0]?.message?.content || '{}';
      const extracted = JSON.parse(content);
      
      // Confidence based on model used
      const confidenceMap = {
        'gpt-4o-mini': 0.85,
        'gpt-4o': 0.95,
        'gpt-4-vision-preview': 0.99
      };
      
      return {
        ballSpeed: extracted.ballSpeed || 0,
        launchAngle: extracted.launchAngle || 0,
        spinRate: extracted.spinRate || 0,
        carry: extracted.carry || 0,
        total: extracted.total || 0,
        confidence: confidenceMap[model as keyof typeof confidenceMap] || 0.8
      };
    } catch (error) {
      console.error('AI extraction failed:', error);
      throw new Error('Failed to extract shot metrics');
    }
  }

  // Premium vision model for dealers - nearly 100% accuracy
  private async extractWithPremiumVision(imageBuffer: Buffer): Promise<ShotMetrics> {
    const base64 = imageBuffer.toString('base64');
    
    const prompt = `You are an expert golf launch monitor analyst. Extract ALL visible metrics from this golf shot monitor image with extreme precision.
    
    Look for:
    1. Ball Speed (may be shown as "Ball Speed", "BS", "Velocity", etc.)
    2. Launch Angle (may be shown as "Launch", "LA", "Vert Angle", etc.)
    3. Spin Rate (may be shown as "Spin", "RPM", "SR", etc.)
    4. Carry Distance (may be shown as "Carry", "CRY", etc.)
    5. Total Distance (may be shown as "Total", "TOT", etc.)
    
    Also identify any other visible metrics like club speed, smash factor, apex height, etc.
    
    Return a JSON object with the numeric values only.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { 
              type: 'image_url', 
              image_url: { 
                url: `data:image/jpeg;base64,${base64}`,
                detail: 'high' // Maximum quality for dealers
              } 
            }
          ]
        }],
        max_tokens: 500,
        temperature: 0
      });

      const content = response.choices[0]?.message?.content || '{}';
      // Extract JSON from response (GPT-4 Vision might add text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const extracted = JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
      
      return {
        ballSpeed: extracted.ballSpeed || extracted.ball_speed || 0,
        launchAngle: extracted.launchAngle || extracted.launch_angle || extracted.launch || 0,
        spinRate: extracted.spinRate || extracted.spin_rate || extracted.spin || 0,
        carry: extracted.carry || extracted.carryDistance || extracted.carry_distance || 0,
        total: extracted.total || extracted.totalDistance || extracted.total_distance || 0,
        confidence: 0.99 // Premium model confidence
      };
    } catch (error) {
      console.error('Premium vision extraction failed:', error);
      // Fallback to GPT-4o
      return this.extractWithAI(imageBuffer, '', 'gpt-4o');
    }
  }

  private inferClub(metrics: ShotMetrics): string {
    const { ballSpeed, launchAngle, spinRate } = metrics;

    // Enhanced club inference with more precise ranges
    if (ballSpeed > 165 && launchAngle < 15 && spinRate < 3000) {
      return 'Driver';
    } else if (ballSpeed > 155 && launchAngle < 18 && spinRate < 3500) {
      return '3 Wood';
    } else if (ballSpeed > 145 && launchAngle < 20 && spinRate < 4500) {
      return '5 Wood';
    } else if (ballSpeed > 140 && launchAngle < 19) {
      return '3 Hybrid';
    } else if (ballSpeed > 135 && launchAngle < 21) {
      return '4 Hybrid';
    } else if (ballSpeed > 130 && launchAngle < 20) {
      return '3 Iron';
    } else if (ballSpeed > 125 && launchAngle < 22) {
      return '4 Iron';
    } else if (ballSpeed > 120 && launchAngle < 24) {
      return '5 Iron';
    } else if (ballSpeed > 115 && launchAngle < 26) {
      return '6 Iron';
    } else if (ballSpeed > 105 && launchAngle < 28) {
      return '7 Iron';
    } else if (ballSpeed > 95 && launchAngle < 30) {
      return '8 Iron';
    } else if (ballSpeed > 85 && launchAngle < 32) {
      return '9 Iron';
    } else if (ballSpeed > 75 && spinRate > 8000) {
      return 'PW';
    } else if (ballSpeed > 65 && spinRate > 9500) {
      return 'GW';
    } else if (ballSpeed < 75 && spinRate > 10000) {
      return 'SW';
    } else if (ballSpeed < 65 && spinRate > 11000) {
      return 'LW';
    }
    
    return 'Unknown';
  }
}

// Singleton instance
let analyzer: ShotAnalyzer;

export function getShotAnalyzer(apiKey: string): ShotAnalyzer {
  if (!analyzer) {
    analyzer = new ShotAnalyzer(apiKey);
  }
  return analyzer;
} 