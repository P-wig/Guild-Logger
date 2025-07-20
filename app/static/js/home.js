function App() {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2 style={{ color: "#4e73df" }}>GuildLogger Dashboard</h2>
      <div style={{ marginBottom: "30px" }}>
        <a href="/" style={{ margin: "0 10px" }}>
          <button>Home</button>
        </a>
        <a href="/about" style={{ margin: "0 10px" }}>
          <button>About</button>
        </a>
        <a href="/askme" style={{ margin: "0 10px" }}>
          <button>Ask</button>
        </a>
        <a href="/create_speech" style={{ margin: "0 10px" }}>
          <button>Create Speech</button>
        </a>
      </div>
      <p>Select a tab to navigate to that route.</p>
    </div>
  );
}


ReactDOM.render(<App />, document.getElementById('root'));