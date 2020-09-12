import * as React from 'react';

type Dir = { [key: string]: Dir | File };
type File = Uint8Array;

type FS = { root: Dir };

type Props = {
  className?: string;
  fs: FS;
  currentFile: string;
  onClick?: (fileName: string) => void;
  onCreateFile?: (str: string) => void;
  onCreateDir?: (str: string) => void;
};

const isDir = (entity: Dir | File): entity is Dir =>
  !(entity instanceof Array) && typeof entity === 'object';

export default ({
  className,
  fs,
  onClick,
  currentFile,
  onCreateDir,
  onCreateFile,
}: Props) => {
  const [isCreate, setIsCreate] = React.useState<'file' | 'dir' | 'none'>(
    'none'
  );
  const [newFileName, setNewFileName] = React.useState('');
  const newFileInput = React.useRef<HTMLInputElement>(null);
  const createEntity = React.useCallback(() => {
    if (newFileName === '') {
      setIsCreate('none');
      return;
    }

    switch (isCreate) {
      case 'file': {
        onCreateFile(newFileName);
        setIsCreate('none');
        break;
      }
      case 'dir': {
        onCreateDir(newFileName);
        setIsCreate('none');
        break;
      }
    }
    setNewFileName('');
  }, [setIsCreate, isCreate, newFileName, setNewFileName]);

  return (
    <div className={`${className} border`}>
      <div className="flex flex-row pl-8">
        <button
          className="p-1 text-2xl"
          onClick={() => {
            if (!newFileInput.current) {
              return;
            }
            newFileInput.current.focus();
            setIsCreate('file');
          }}
        >
          ➕
        </button>
      </div>
      <DirView
        onClick={onClick}
        dir={fs.root}
        dirName=""
        currentFile={currentFile}
      />
      <input
        className={`border w-full ${isCreate === 'none' ? 'opacity-0' : ''}`}
        onBlur={createEntity}
        onChange={(x) => setNewFileName(x.currentTarget.value)}
        value={newFileName}
        ref={newFileInput}
      ></input>
    </div>
  );
};

const DirView = ({
  dir,
  dirName,
  currentFile,
  onClick,
}: {
  dir: Dir;
  dirName: string;
  currentFile: string;
  onClick: (name: string) => void;
}) => (
  <>
    {Object.entries(dir).map(([name, entity]) =>
      isDir(entity) ? (
        <details key={name} className="pl-4">
          <summary>{name}</summary>
          <DirView
            onClick={onClick}
            dir={entity}
            dirName={`${dirName}${name}/`}
            currentFile={currentFile}
          />
        </details>
      ) : (
        <FileView
          key={name}
          onClick={onClick}
          className="pl-8 w-full text-left"
          dirName={dirName}
          name={name}
          isSelected={currentFile === `${dirName}${name}`}
        />
      )
    )}
  </>
);

const FileView = ({
  className,
  dirName,
  name,
  onClick,
  isSelected,
}: {
  className?: string;
  dirName: string;
  name: string;
  onClick: (name: string) => void;
  isSelected: boolean;
}) => (
  <button
    onClick={() => onClick(`${dirName}${name}`)}
    className={`${className} ${isSelected ? ' bg-gray-500' : ''}`}
  >
    {name}
  </button>
);
