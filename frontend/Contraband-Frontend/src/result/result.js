import React from "react";
import Stepper from "./../components/stepper";

class QueryResult extends React.Component {
  render = () => (
    <React.Fragment>
      <Stepper step={4} />
      <div style={{ textAlign: "center" }}>
        <h4>
          Successfully saved the query and the result. The result will be shown
          in this page soon. This is currently under development
        </h4>
      </div>
    </React.Fragment>
  );
}

export default QueryResult;
