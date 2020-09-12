use clumsy::fs::inmem::InMemFileSystem;
use clumsy::fs::FileSystem;
use clumsy::object::GitObject;
use clumsy::Git;
use hex;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct Context {
    git: Git<InMemFileSystem>,
}

#[wasm_bindgen]
impl Context {
    pub fn new() -> Self {
        let fs = InMemFileSystem::init();

        Self { git: Git::new(fs) }
    }

    pub fn write(&mut self, path: String, text: String) -> Result<(), JsValue> {
        let result = self.git.file_system.write(path, text.as_bytes());
        result.map_err(|x| JsValue::from(x.to_string()))
    }

    pub fn read(&self, path: String) -> Result<Vec<u8>, JsValue> {
        self.git
            .file_system
            .read(path)
            .map_err(|x| JsValue::from(x.to_string()))
    }

    pub fn git_add(&mut self, path: String) -> Result<(), JsValue> {
        let bytes = self.read(path.clone())?;

        // git hash-object -w path
        let blob = self
            .git
            .hash_object(&bytes)
            .map(GitObject::Blob)
            .map_err(|x| JsValue::from(x.to_string()))?;
        self.git
            .write_object(&blob)
            .map_err(|x| JsValue::from(x.to_string()))?;

        // git update-index --add --cacheinfo <mode> <hash> <name>
        let index = self
            .git
            .update_index(&blob.calc_hash(), path)
            .map_err(|x| JsValue::from(x.to_string()))?;
        self.git
            .write_index(&index)
            .map_err(|x| JsValue::from(x.to_string()))?;

        Ok(())
    }

    pub fn git_commit(&mut self, message: String) -> Result<(), JsValue> {
        // git write-tree
        let tree = self
            .git
            .write_tree()
            .map(GitObject::Tree)
            .map_err(|x| JsValue::from(x.to_string()))?;
        self.git
            .write_object(&tree)
            .map_err(|x| JsValue::from(x.to_string()))?;

        let tree_hash = tree.calc_hash();
        // echo message | git commit-tree <hash>
        let commit = self
            .git
            .commit_tree(
                "uzimaru0000".to_string(),
                "shuji365630@gmail.com".to_string(),
                hex::encode(tree_hash),
                message,
            )
            .map(GitObject::Commit)
            .map_err(|x| JsValue::from(x.to_string()))?;
        self.git
            .write_object(&commit)
            .map_err(|x| JsValue::from(x.to_string()))?;

        // git update-ref refs/heads/master <hash>
        let head_ref = self
            .git
            .head_ref()
            .map_err(|x| JsValue::from(x.to_string()))?;
        self.git
            .update_ref(head_ref, &commit.calc_hash())
            .map_err(|x| JsValue::from(x.to_string()))?;

        Ok(())
    }

    pub fn git_log(&mut self) -> Result<JsValue, JsValue> {
        let commit = self
            .git
            .head_ref()
            .and_then(|x| self.git.read_ref(x))
            .and_then(|x| self.git.read_object(x))
            .and_then(|x| self.git.cat_file_p(&x))
            .map_err(|x| JsValue::from(x.to_string()))?;

        let logs = (0..)
            .scan(Some(commit), |st, _| {
                let next = match st {
                    Some(GitObject::Commit(commit)) => {
                        if let Some(parent) = &commit.parent {
                            self.git
                                .read_object(parent.clone())
                                .and_then(|x| self.git.cat_file_p(&x))
                                .ok()
                        } else {
                            None
                        }
                    }
                    _ => None,
                };
                let curr = st.clone();
                *st = next;
                curr
            })
            .collect::<Vec<_>>();

        JsValue::from_serde(&logs).map_err(|x| JsValue::from(x.to_string()))
    }

    pub fn git_restore(&mut self, hash: String, path: String) -> Result<(), JsValue> {
        let commit = self
            .git
            .read_object(hash)
            .and_then(|x| self.git.cat_file_p(&x))
            .map_err(|x| JsValue::from(x.to_string()))
            .and_then(|x| match x {
                GitObject::Commit(commit) => Ok(commit),
                _ => Err(JsValue::from("this hash is not commit object")),
            })?;

        let tree = self
            .git
            .read_object(commit.tree)
            .and_then(|x| self.git.cat_file_p(&x))
            .map_err(|x| JsValue::from(x.to_string()))
            .and_then(|x| match x {
                GitObject::Tree(tree) => Ok(tree),
                _ => Err(JsValue::from("this hash is not tree object")),
            })?;

        let file = tree
            .contents
            .iter()
            .filter(|x| x.name == path)
            .map(|file| {
                self.git
                    .read_object(hex::encode(&file.hash))
                    .and_then(|x| self.git.cat_file_p(&x))
                    .map_err(|x| JsValue::from(x.to_string()))
                    .and_then(|x| match x {
                        GitObject::Blob(blob) => Ok((file.name.clone(), blob)),
                        _ => Err(JsValue::from("this hash is not blob object")),
                    })
            })
            .try_fold(Vec::new(), |mut acc, x| {
                x.map(|x| {
                    acc.push(x);
                    acc
                })
            })?;

        file.iter()
            .try_for_each(|(file_name, blob)| self.write(file_name.clone(), blob.content.clone()))
    }
}

#[wasm_bindgen]
pub fn debug(ctx: &Context) -> Result<JsValue, JsValue> {
    JsValue::from_serde(&ctx.git.file_system).map_err(|x| JsValue::from(x.to_string()))
}
