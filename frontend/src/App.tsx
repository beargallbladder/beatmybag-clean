function App() {
  console.log("App component rendering");
  
  return (
    <div style={{ padding: "50px", backgroundColor: "lightgreen" }}>
      <h1>BeatMyBag App is Loading!</h1>
      <p>If you see this, React is working.</p>
      <button onClick={() => alert("Button clicked!")}>
        Test Button
      </button>
    </div>
  )
}

export default App
