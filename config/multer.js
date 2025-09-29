const multer = require('multer')
const path = require('path')


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../public/uploads');
        console.log("Destination Path: ", uploadPath); // Logging destination path
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const name = Date.now() + '-' + file.originalname;
        cb(null, name);
    }
});

// helper function needed
// git branch

const upload = multer({ storage: storage })

module.exports = {  
 upload
}