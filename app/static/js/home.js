function App() {
  return (
    <div className="container" style={{ textAlign: "center", marginTop: "50px" }}>
      <h2 className="logo" style={{ color: "#4e73df" }}>GuildLogger Dashboard</h2>
      <div style={{ marginBottom: "30px" }}>
        <a href="/" style={{ margin: "0 10px" }}>
          <button>Home</button>
        </a>   
        <a href="/guild" style={{ margin: "0 10px" }}>
          <button>Guild</button>
        </a>
      </div>
      <p>Select a tab to navigate to that route.</p>
    </div>
  );
}


ReactDOM.render(<App />, document.getElementById('root'));