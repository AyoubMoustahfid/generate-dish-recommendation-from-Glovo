const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        unique: true
    },

    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number
    },
    photo: {
        data: Buffer,
        contentType: String
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    shipping: {
        type: Boolean,
        default: false,
        required: false
    },
    sold: {
        type: Number,
        default: 0
    },
    easy: {
        type: Boolean,
        default: false,
    },
    promo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Promo"
    }
}, {timestamps: true})

module.exports = mongoose.model("Product", productSchema)
