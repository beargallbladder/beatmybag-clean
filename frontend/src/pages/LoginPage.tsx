export function LoginPage() {
  const handleLogin = () => {
    localStorage.setItem("token", "test-token");
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Welcome to BeatMyBag</h2>
          <p className="mt-2 text-gray-600">Track your golf shots with AI precision</p>
        </div>
        
        <div className="mt-8">
          <button
            onClick={handleLogin}
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors"
          >
            Continue to Dashboard
          </button>
        </div>
        
        <div className="text-center text-sm text-gray-500">
          <p>Free users get 30 shots</p>
          <p>Pro users get unlimited shots for $7.99/year</p>
        </div>
      </div>
    </div>
  );
}
