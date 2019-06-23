import React from "react";
import { DateInput, TimeInput } from "semantic-ui-calendar-react";

class DateTimeClass extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      date: "",
      time: "",
      step: 1,
      time_step: 1
    };
  }

  handleChange = (e, obj) => {
    if (this.state.time_step === 1) {
      console.log("this is the first step");
      this.setState({ time_step: 2, time: obj.value });
    } else {
      console.log("error on coming here");
      this.props.set(
        this.props.type === "start"
          ? {
              open_start: false,
              start_date: this.state.date + " " + obj.value
            }
          : {
              open_end: false,
              end_date: this.state.date + " " + obj.value
            }
      );
    }
  };

  render = () => (
    <div>
      <div style={this.state.step === 1 ? {} : { display: "none" }}>
        <DateInput
          inline
          value={this.state.date}
          name="date"
          dateFormat="YYYY-MM-DD"
          onChange={(e, obj) => this.setState({ date: obj.value, step: 2 })}
        />
      </div>
      <div style={this.state.step === 2 ? {} : { display: "none" }}>
        <TimeInput
          inline
          value={this.state.time}
          name="time"
          onChange={this.handleChange}
        />
      </div>
    </div>
  );
}

export default DateTimeClass;
