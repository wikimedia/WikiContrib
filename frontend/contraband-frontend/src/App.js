import React from "react";
import "./App.css";

// var uri = "http://127.0.0.1:8000/query/add/user/";
var method = "PATCH";
var uri =
  "http://127.0.0.1:8000/query/j2I70bgkj80XdcwpRgL0NyMpNfdgItqQOiRJ2Dm2v7yt2FfxVYjRtQJ0RQoouTYl/update/user/";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      file: false,
      chunk: 0,
      chunks: 0
    };
  }

  click = hash => {
    this.setState({ chunk: this.state.chunk + 1 }, () => {
      if (this.state.chunk === 1) {
        this.setState(
          {
            chunks: Math.ceil(this.state.file.size / 1048576)
          },
          () => {
            if (this.state.chunk <= this.state.chunks) {
              this.fetch(hash);
            }
          }
        );
      } else {
        if (this.state.chunk <= this.state.chunks) {
          this.fetch(hash);
        }
      }
    });
  };

  fetch = hash => {
    let data = new FormData();
    if (this.state.chunk === this.state.chunks) {
      data.append("complete", 0);
    } else {
      data.append("complete", -1);
    }
    if (this.state.chunk > 1) {
      data.append("hash_code", hash);
    }
    data.append("file", 0);
    data.append("chunk", this.state.chunk);
    let begin = (this.state.chunk - 1) * 1024 * 1024;
    let file = this.state.file.slice(begin, begin + 1024 * 1024);
    data.append("csv_file", file);
    fetch(uri, {
      method: method,
      body: data
    })
      .then(response => response.json())
      .then(object => {
        this.click(object.message);
      })
      .catch(error => {
        console.log(error);
      });
  };

  render = () => {
    return (
      <div>
        <input
          style={{ display: "none" }}
          type="file"
          id="postfile"
          onChange={e => {
            this.setState({ file: e.target.files[0] });
          }}
        />
        <label htmlFor="postfile" style={{ cursor: "pointer" }}>
          Add file{" "}
        </label>
        {this.state.file !== false ? this.state.file.name : ""}
        <br />
        <br />
        <button onClick={() => this.click("")}>click me</button>
      </div>
    );
  };
}

export default App;
