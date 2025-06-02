export function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Dashboard</h1>
        <p className="text-gray-600 mb-8">Welcome to BeatMyBag Dashboard!</p>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <button 
            onClick={() => alert("Capture feature coming soon!")}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
          >
            📸 Capture Shot
          </button>
        </div>
        
        <div className="mt-4">
          <button 
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/";
            }}
            className="text-gray-600 hover:text-gray-800"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
