import React, { Component } from "react";
import { Card, Grid, Popup } from "semantic-ui-react";

export default class Stepper extends Component {
  constructor(props) {
    super(props);
  }

  render = () => {
    let arr = ["I", "II", "III"];
    let contents = [
      <React.Fragment>
        <tspan x="32" dy="0em" style={{ fontWeight: "bold" }}>
          Create
        </tspan>
        <tspan x="33.5" dy="1em" style={{ fontWeight: "bold" }}>
          Query
        </tspan>
      </React.Fragment>,
      <React.Fragment>
        <tspan x="30" dy="0em" style={{ fontWeight: "bold" }}>
          Add
        </tspan>
        <tspan x="30" dy="1em" style={{ fontWeight: "bold" }}>
          filters
        </tspan>
      </React.Fragment>,
      <React.Fragment>
        <tspan x="32" dy="0.3em" style={{ fontWeight: "bold" }}>
          Result
        </tspan>
      </React.Fragment>
    ];

    let popover = [
      "Create Query and add users to the query.",
      "Add additional filters to the query",
      "View the final result"
    ];

    return (
      <React.Fragment>
        <Grid style={{ marginTop: 70 }}>
          <Grid.Row>
            <Grid.Column computer={4} tablet={1} mobile={1} />

            <Grid.Column computer={8} tablet={14} mobile={14}>
              <Card style={{ width: "100%", textAlign: "center" }}>
                <div style={{ display: "inline" }}>
                  {arr.map((obj, i) => (
                    <React.Fragment>
                      <Popup
                        trigger={
                          <svg width="58px" height="80px" className="steps">
                            <circle
                              cx="32"
                              cy="25"
                              r="22"
                              stroke-width="1"
                              fill={
                                i + 1 === this.props.step
                                  ? "lightblue"
                                  : i + 1 < this.props.step
                                  ? "#7ac142"
                                  : "lightgray"
                              }
                            />
                            {i + 1 < this.props.step ? (
                              <path
                                d="M23 29 L29 35 L44 19"
                                stroke="white"
                                stroke-width="3"
                                fill="none"
                              />
                            ) : (
                              <text
                                x="32"
                                y="25"
                                text-anchor="middle"
                                dy=".3em"
                                fill="white"
                                style={{ fontSize: 20 }}
                              >
                                {obj}
                              </text>
                            )}

                            <text
                              x="25"
                              y="60"
                              text-anchor="middle"
                              dy=".3em"
                              fill="black"
                            >
                              {contents[i]}
                            </text>
                          </svg>
                        }
                        content={popover[i]}
                        position="bottom center"
                      />
                      {i + 1 !== 3 ? (
                        <svg
                          height="2"
                          width="22%"
                          style={{ position: "relative", top: -52 }}
                        >
                          <line
                            x1="0"
                            y1="0"
                            x2="100%"
                            y2="0"
                            className="step_line"
                          />
                        </svg>
                      ) : (
                        ""
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </Card>
            </Grid.Column>

            <Grid.Column computer={4} tablet={1} mobile={1} />
          </Grid.Row>
        </Grid>
      </React.Fragment>
    );
  };
}
