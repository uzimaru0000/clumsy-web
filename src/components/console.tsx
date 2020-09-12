import * as React from 'react';

type Props = {
  onAdd: () => void;
  onCommit: (message: string) => void;
  onRestore: (hash: string, fileName: string) => void;
  log: { Commit: Commit; hash: string }[];
};

export type Commit = {
  tree: string;
  parent?: string;
  message: string;
  author: User;
  committer: User;
};

type User = {
  email: string;
  name: string;
  ts: string;
};

export default (props: Props) => {
  const [message, setMessage] = React.useState('');
  const [commitHash, setCommitHash] = React.useState('');
  const [fileName, setFileName] = React.useState('');

  return (
    <div className="border-t">
      <div className="pb-1">
        <button className="border p-1" onClick={props.onAdd}>
          git add
        </button>
      </div>
      <div className="pb-1">
        <button
          className={`border p-1 ${
            message.length <= 0 ? 'opacity-25 cursor-not-allowed' : ''
          }`}
          disabled={message.length <= 0}
          onClick={() => {
            props.onCommit(message);
            setMessage('');
          }}
        >
          git coimmit -m
        </button>
        <input
          className="ml-1 p-1 border"
          placeholder="message"
          value={message}
          onChange={(e) => setMessage(e.currentTarget.value)}
        />
      </div>
      <div className="pb-1">
        <button
          className={`border p-1 ${
            commitHash.length <= 0 && fileName.length <= 0
              ? 'opacity-25 cursor-not-allowed'
              : ''
          }`}
          disabled={commitHash.length <= 0 && fileName.length <= 0}
          onClick={() => {
            props.onRestore(commitHash, fileName);
            setCommitHash('');
            setFileName('');
          }}
        >
          git restore --source
        </button>
        <input
          className="ml-1 p-1 w-1/3 border"
          placeholder="commit hash"
          value={commitHash}
          onChange={(e) => setCommitHash(e.currentTarget.value)}
        />
        <input
          className="ml-1 p-1 border"
          placeholder="file-name"
          value={fileName}
          onChange={(e) => setFileName(e.currentTarget.value)}
        />
      </div>
      <div className="pb-1">
        {props.log.map((x) => (
          <CommitLog key={x.hash} {...x} />
        ))}
      </div>
    </div>
  );
};

const CommitLog = ({ Commit, hash }: { Commit: Commit; hash: string }) => (
  <details>
    <summary>
      commit{'\t'}
      {hash}
    </summary>
    <div className="pl-4">
      tree{'\t'}
      {Commit.tree}
    </div>
    {Commit.parent && (
      <div className="pl-4">
        parent{'\t'}
        {Commit.parent}
      </div>
    )}
    <div className="pl-4">
      author{'\t'}
      {userToString(Commit.author)}
    </div>
    <div className="pl-4">
      committer{'\t'}
      {userToString(Commit.committer)}
    </div>
    <div className="pl-4 pt-4">{Commit.message}</div>
  </details>
);

const userToString = (user: User) => {
  const date = new Date(user.ts);
  const offs = (date.getTimezoneOffset() / -60) * 100;
  return `${user.name} <${user.email}> ${date.getTime()} ${
    offs > 0 ? '+' : '-'
  }${offs.toString().padStart(4, '0')}`;
};
