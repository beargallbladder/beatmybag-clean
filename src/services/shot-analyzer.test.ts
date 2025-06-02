import { describe, expect, it, beforeEach } from 'bun:test';
import { ShotAnalyzer } from './shot-analyzer';

// Mock OpenAI responses
const mockOpenAI = {
  chat: {
    completions: {
      create: async (params: any) => {
        // Mock OCR response
        if (params.messages[0].content[0].text.includes('Extract all text')) {
          return {
            choices: [{
              message: {
                content: 'Ball Speed: 150.2 mph\nLaunch Angle: 12.5°\nSpin Rate: 2850 rpm\nCarry: 245 yds\nTotal: 268 yds'
              }
            }]
          };
        }
        
        // Mock metrics extraction
        return {
          choices: [{
            message: {
              content: JSON.stringify({
                ballSpeed: 150.2,
                launchAngle: 12.5,
                spinRate: 2850,
                carry: 245,
                total: 268
              })
            }
          }]
        };
      }
    }
  }
};

describe('ShotAnalyzer', () => {
  let analyzer: ShotAnalyzer;
  
  beforeEach(() => {
    // Create analyzer with mocked OpenAI
    analyzer = new ShotAnalyzer('test-key');
    // @ts-ignore - Override OpenAI instance
    analyzer.openai = mockOpenAI;
  });

  it('should extract metrics from clear text using regex', async () => {
    const testImage = Buffer.from('test-image');
    const result = await analyzer.analyze(testImage);
    
    expect(result.ballSpeed).toBe(150.2);
    expect(result.launchAngle).toBe(12.5);
    expect(result.spinRate).toBe(2850);
    expect(result.carry).toBe(245);
    expect(result.total).toBe(268);
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('should infer correct club based on metrics', async () => {
    const testImage = Buffer.from('test-image');
    const result = await analyzer.analyze(testImage);
    
    // With these metrics, should be a driver
    expect(result.club).toBe('Driver');
  });

  it('should cache results for identical images', async () => {
    const testImage = Buffer.from('test-image');
    
    // First call
    const result1 = await analyzer.analyze(testImage);
    
    // Second call - should use cache
    const result2 = await analyzer.analyze(testImage);
    
    expect(result1).toEqual(result2);
  });

  it('should handle poor quality images with AI fallback', async () => {
    // Override mock to simulate poor OCR
    analyzer.openai.chat.completions.create = async (params: any) => {
      if (params.messages[0].content[0].text.includes('Extract all text')) {
        return {
          choices: [{
            message: { content: 'Ball Speed: ???' } // Incomplete OCR
          }]
        };
      }
      
      // AI fallback should work
      return {
        choices: [{
          message: {
            content: JSON.stringify({
              ballSpeed: 145,
              launchAngle: 11,
              spinRate: 2700,
              carry: 240,
              total: 265
            })
          }
        }]
      };
    };

    const testImage = Buffer.from('poor-quality-image');
    const result = await analyzer.analyze(testImage);
    
    expect(result.ballSpeed).toBe(145);
    expect(result.confidence).toBe(0.95); // AI extraction confidence
  });

  it('should infer PW for low speed high spin shots', async () => {
    analyzer.openai.chat.completions.create = async () => ({
      choices: [{
        message: {
          content: JSON.stringify({
            ballSpeed: 85,
            launchAngle: 25,
            spinRate: 9500,
            carry: 125,
            total: 130
          })
        }
      }]
    });

    const testImage = Buffer.from('pw-shot');
    const result = await analyzer.analyze(testImage);
    
    expect(result.club).toBe('PW');
  });
});

describe('Shot Analyzer Performance', () => {
  it('should analyze shots quickly', async () => {
    const analyzer = new ShotAnalyzer('test-key');
    analyzer.openai = mockOpenAI;
    
    const start = performance.now();
    const testImage = Buffer.from('test-image');
    await analyzer.analyze(testImage);
    const duration = performance.now() - start;
    
    // Should be fast (excluding actual API calls)
    expect(duration).toBeLessThan(100);
  });

  it('should handle concurrent requests', async () => {
    const analyzer = new ShotAnalyzer('test-key');
    analyzer.openai = mockOpenAI;
    
    const images = Array(10).fill(null).map((_, i) => 
      Buffer.from(`test-image-${i}`)
    );
    
    const results = await Promise.all(
      images.map(img => analyzer.analyze(img))
    );
    
    expect(results).toHaveLength(10);
    results.forEach(result => {
      expect(result.ballSpeed).toBeGreaterThan(0);
    });
  });
}); 