// @ts-ignore
import { Context, debug } from '../lib/Cargo.toml';
import * as React from 'react';
import { render } from 'react-dom';
import FileSystem from './components/file_system';
import Editor from './components/editor';
import Console, { Commit } from './components/console';

const useGit = () => {
  const git = React.useMemo<any>(Context.new, []);
  return git;
};

const App = () => {
  const git = useGit();
  const [text, setText] = React.useState('');
  const [fs, setFS] = React.useState(debug(git));
  const [log, setLog] = React.useState<{ Commit: Commit; hash: string }[]>([]);
  const [fileName, setFileName] = React.useState('hello.js');

  React.useEffect(() => {
    git.write(fileName, text);
    setFS(debug(git));
  }, [git, text, setFS]);

  const gitAdd = React.useCallback(() => {
    git.git_add(fileName);
    setFS(debug(git));
  }, [git, setFS, fileName]);
  const gitCommit = React.useCallback(
    (message) => {
      git.git_commit(message);
      setFS(debug(git));
      setLog(git.git_log());
    },
    [git, setFS, setLog]
  );
  const gitRestore = React.useCallback(
    (hash, fileName) => {
      git.git_restore(hash, fileName);
      setFS(debug(git));
      const data = git.read(fileName);
      setText(new TextDecoder().decode(data));
    },
    [git, setFS, fileName, setText]
  );
  const fileChange = React.useCallback(
    (fileName) => {
      const data = git.read(fileName);
      setText(new TextDecoder().decode(data));
      setFileName(fileName);
    },
    [setText, setFileName]
  );
  const createFile = React.useCallback(
    (fileName) => {
      git.write(fileName, '');
      setText('');
      setFileName(fileName);
      setFS(debug(git));
    },
    [git, setText, setFileName]
  );

  return (
    <div className="flex flex-row">
      <FileSystem
        className="w-1/5 h-screen overflow-scroll"
        fs={fs}
        onClick={fileChange}
        currentFile={fileName}
        onCreateFile={createFile}
      />
      <div className="flex flex-col w-4/5 h-screen overflow-scroll">
        <Editor value={text} onInput={setText} />
        <Console
          onAdd={gitAdd}
          onCommit={gitCommit}
          onRestore={gitRestore}
          log={log}
        />
      </div>
    </div>
  );
};

render(React.createElement(App), document.getElementById('mount'));
