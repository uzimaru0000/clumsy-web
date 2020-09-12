import * as React from 'react';

type Props = {
  value?: string;
  onInput?: (str: string) => void;
};

export default (props: Props) => (
  <div className="w-full">
    <textarea
      className="w-full p-1"
      style={{ height: '50vh' }}
      value={props.value}
      onChange={(e) => props.onInput && props.onInput(e.currentTarget.value)}
    ></textarea>
  </div>
);
