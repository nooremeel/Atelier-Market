const fs = require('fs');

const deleteFile = (filePath) => {
    return fs.promises.unlink(filePath).catch((err) => {
        if (err.code !== 'ENOENT') console.error('deleteFile failed:', err);
    });
};

exports.deleteFile = deleteFile;
