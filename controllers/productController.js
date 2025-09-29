const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const SubCategory = require('../models/subcategoryModel')

const { v4: uuidv4 } = require("uuid")
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')



const loadaddproduct = async (req, res) => {
    try {
        const categories = await Category.find();
        const sub = await SubCategory.find()
        res.render('addproduct', { categories ,subCat:sub});
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}

const addProduct = async (req, res) => {
    try {
        const { Bookname, Description, Categories, Regularprice, stock, saleprice, subCategories } = req.body;
        const imageUrls = [];
        
        for (const file of req.files) {
            const filename = `${uuidv4()}.jpg`;
            try {
                const imageUrl = `${filename}`;
                const path = require('path');
                const outputPath = path.join(__dirname, '../public/uploads', filename);
                
                await sharp(file.path)
                    .resize({ width: 386, height: 595 })
                    .toFile(outputPath);

                imageUrls.push(imageUrl);
                fs.unlink(file.path, (err) => {
                    if (err) {
                        console.error(`Error deleting file: ${err}`);
                    } else {
                        console.log(`File deleted: ${file.path}`);
                    }
                });
            } catch (sharpError) {
                console.error("Sharp Error:", sharpError);
                throw new Error("Invalid input: Sharp failed to process the image.");
            }
        }

        const product = new Product({
            Bookname: Bookname,
            Description: Description,
            Categories: Categories,
            subCategories: subCategories,
            Regularprice: Regularprice,
            stock: stock,
            saleprice: saleprice,
            Images: imageUrls
        });

        const productData = await product.save();
        
        if (productData) {
            res.redirect('/admin/productslist');
        } else {
            console.log("Error saving product.");
            res.status(500).send("Error saving product.");
        }
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).send("Internal Server Error");
    }
}



const loadeditProduct = async (req, res) => {
    try {
        const id = req.query.id
        req.session.editProductId = id;
        const sub = await SubCategory.find()

        const product = await Product.findById(id).populate('Categories').populate('subCategories')
        const categories = await Category.find({ is_Active: true })
        res.render('editproduct', { product, categories,subCat:sub })
    } catch (error) {
        console.error(error);
    }
}


const editProduct = async (req, res) => {
    try {
        const { Bookname, Description, Regularprice, saleprice, stock, Categories, subCategories } = req.body;
        const images = req.files;
        const editProduct = await Product.findOne({ _id: req.session.editProductId });
        
        editProduct.Bookname = Bookname;
        editProduct.Description = Description;
        editProduct.Regularprice = Regularprice;
        editProduct.saleprice = saleprice;
        editProduct.stock = stock;
        editProduct.Categories = Categories;
        editProduct.subCategories = subCategories;

        if (images && images.length > 0) {
            for (const file of images) {
                const filename = `${uuidv4()}.jpg`;
                const outputPath = path.join(__dirname, '../public/uploads', filename);
                
                try {
                    await sharp(file.path)
                        .resize({ width: 386, height: 595 })
                        .toFile(outputPath);

                    editProduct.Images.push(filename);
                    
                    fs.unlink(file.path, (err) => {
                        if (err) {
                            console.error(`Error deleting file: ${err}`);
                        } else {
                            console.log(`File deleted: ${file.path}`);
                        }
                    });
                } catch (sharpError) {
                    console.error("Sharp Error:", sharpError);
                    throw new Error("Invalid input: Sharp failed to process the image.");
                }
            }
        }

        const productUpdateddata = await editProduct.save();
        
        if (productUpdateddata) {               
            res.redirect('/admin/productslist');
        } else {
            console.log("Error updating product.");
            res.status(500).send("Error updating product.");
        }
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).send("Internal Server Error");
    }
}



const ToggleblockProduct = async (req, res) => {
    try {
        const id = req.query.id
        const product = await Product.findOne({ _id: id });
        product.is_Active = !product.is_Active
        await product.save()
        res.redirect('/admin/productslist');
    } catch (error) {
        console.error(error);
    }
}



const removeImage = async (req, res) => {
    try {
        const imageName = req.body.filename;
        const product = await Product.findById(req.body.productid);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        const index = product.Images.findIndex((image) => image === imageName);
        console.log(index, "productIndex")
        
        if (index !== -1) {
            product.Images.splice(index, 1);
            await product.save();
            res.status(200).json({ message: 'Image removed successfully', index });
        } else {
            res.status(404).json({ message: 'Image not found in product' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

``

module.exports = {
    loadaddproduct,
    addProduct,
    loadeditProduct,
    ToggleblockProduct,
    editProduct,
    removeImage

}