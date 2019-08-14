import React from "react";
import { Placeholder } from "semantic-ui-react";

const Loading = props => {
  const { count = 3, style = { height: 30, margin: 5 } } = props;
  const items = [];
  let i = count;
  while (i > 0) {
    items.push(
      <Placeholder fluid style={style} key={count}>
        <Placeholder.Line />
      </Placeholder>
    );
    i--;
  }
  return <div>{items}</div>;
};

export default Loading;
