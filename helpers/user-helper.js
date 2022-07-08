var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const async = require("hbs/lib/async");
var objectId = require('mongodb').ObjectId
const collections = require('../config/collections');
const { response } = require('../app');
const Razorpay = require('razorpay');
const { ObjectId } = require('mongodb');
const res = require('express/lib/response');
const { reject, promise } = require('bcrypt/promises');
const { isSafeFromPollution } = require('express-fileupload/lib/utilities');
const { DefaultsList } = require('twilio/lib/rest/autopilot/v1/assistant/defaults');
const { log } = require('console');

var instance = new Razorpay({
    key_id: 'rzp_test_LzENomul3uevEZ',
    key_secret: 'XR8HpjEDW4U4yk01pct2rnkA',
});
const paypal = require('paypal-rest-sdk');
const { get } = require('express/lib/response');

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'AfP1rKhgP7oDwDO8RMHIA2Hyj39G8qyKOsN2G87VruR0gIh3yvwiLwDPlCk-6QyJfUgCt3vw0Ppkd0TH',
    'client_secret': 'EAhmOUwpXxN16sZx5JmaIzNS1HDM-DDE2LxqhZD3tkjpsqq9q-wi5xegDC13-r0bKE0bUlR4PDtcJy9o'
});

module.exports = {


    addProduct: (product, callback) => {
        console.log(product);
        db.get().collection('product').insertOne(product).then((data) => {

            callback(data)
        })
    },

    doSignup: (userData) => {
        userData.address = []
        return new Promise(async (resolve, reject) => {

            userData.password = await bcrypt.hash(userData.password, 10)
            console.log(userData.password);
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
              

                console.log(userData);
                resolve(data)
            })


        })

    },

    signUp: (email) => {
        let response = {}
        return new Promise(async (resolve, reject) => {
            let emails = await db.get().collection(collection.USER_COLLECTION).findOne({ email: email.email });
            if (emails) {
                response.status = true
                resolve(response)

            } else {
                resolve({ status: false })
            }
        })

    },



    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            if (user) {
                console.log(user)
                bcrypt.compare(userData.password, user.password).then((status) => {
                    if (status) {
                        console.log("login sucess");
                        response.user = user;
                        response.status = true
                        resolve(response)
                    } else {
                        resolve({ status: false })
                        console.log("login failed")

                    }
                })
            } else {
                console.log("login failed due to ");
                resolve({ status: false })

            }

        })
    },




    getAllUser: () => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collections.USER_COLLECTION).find().toArray()
            resolve(user)
        })
    },

    deleteUser: (userId) => {
        return new Promise((res, rej) => {
            db.get().collection(collections.USER_COLLECTION).remove({ _id: objectId(userId) }).then((response) => {
                console.log(response);
                res(response)
            })
        })
    },

    getuserdetails: (userId) => {
        return new Promise((res, rej) => {
            db.get().collection(collections.USER_COLLECTION).findOne({ _id: ObjectId(userId) }).then((user) => {
                res(user)
            })
        })
    },


    updateUser: (userId, userDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION)
                .updateOne({ _id: objectId(userId) }, {
                    $set: {
                        name: userDetails.name,
                        email: userDetails.email

                    }
                }).then((response) => {
                    resolve()
                })
        })
    },

    checkUser: (userData) => {
        return new Promise(async (resolve) => {
            let response = []
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
            if (user) {
                response.status = true
                response.user = user
                resolve(response)



            } else {
                resolve(response)
            }

        })
    },
    addToCart: (productId, userId) => {
        let productObj = {
            item: objectId(productId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (userCart) {

                let proExist = userCart.product.findIndex(products => products.item == productId)
                console.log(proExist);
                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: ObjectId(userId), 'product.item': objectId(productId) },
                        {
                            $inc: { 'product.$.quantity': 1 }
                        }
                    ).then(() => {
                        resolve({ proexist: true })
                    })

                } else {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId) },
                        {
                            $push: { product: productObj }

                        }).then((res) => {
                            resolve({ status: true })
                        })
                }

            } else {
                let cartObj = {
                    user: objectId(userId),
                    product: [productObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })

            }
        })
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {

            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$product'
                },
                {
                    $project: {
                        item: '$product.item',
                        quantity: '$product.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item', 
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: { $arrayElemAt: ['$product', 0] }
                    }
                },
               

            ]).toArray()
            resolve(cartItems)

        })
    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            console.log(cart);
            if (cart) {
                count = cart.product.length
                resolve(count)
            } else {
                resolve(count)
            }

        })
    },

    changeproductquantity: (details) => {
        details.count = parseInt(details.count)
        console.log(details.count);
        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {

                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: ObjectId(details.cart) },
                    {
                        $pull: { product: { item: ObjectId(details.product) } }
                    }).then((response) => {
                        resolve({ removeProduct: true })

                    })
            } else {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart), 'product.item': objectId(details.product) },
                        {
                            $inc: { 'product.$.quantity': details.count }
                        }
                    ).then((response) => {
                        resolve({ status: true })
                    })
            }
        })
    },

    removeCartProduct: (details) => {
        return new Promise((resolve, reject) => {


            db.get().collection(collection.CART_COLLECTION).updateOne({ _id: ObjectId(details.cart) },
                {
                    $pull: { product: { item: ObjectId(details.product) } }
                }).then((response) => {
                    resolve({ removeProduct: true })

                })

        })
    },


    Addres: (body, userId) => {
        new Promise(async (resolve, reject) => {

            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: ObjectId(userId) });
            console.log(user);
            if (user.address) {
                db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) },
                    {
                        $push: { address: body }
                    }).then(() => {
                        resolve(response)
                    })
            } else {
                db.get().collection(collection.USER_COLLECTION).updateOne({ _id: ObjectId(userId) }, {
                    $set: { address: body }
                }).then(() => {
                    resolve(response)
                })
            }
        });


    },

    getAddresdetails: (userId) => {
        return new Promise((res, rej) => {
            db.get().collection(collections.USER_COLLECTION).findOne({ _id: ObjectId(userId) }).then((user) => {
                res(user)
            })
        })
    },

    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {

            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$product'
                },
                {
                    $project: {
                        item: '$product.item',
                        quantity: '$product.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', '$product.price'] } }
                    }

                }

            ]).toArray()
            console.log(total)
            if (total[0]) {

                resolve(total[0].total)

            } else {

                resolve([0])
            }
        })

    },


    placeOrder: (order, products, total) => {
        return new Promise((resolve, reject) => {
            console.log(order, products, total);
            let status = order['payment-method'] === 'COD' ? 'Placed' : 'pending'
            var date = new Date()
            var month = date.getUTCMonth() + 1
            var day = date.getUTCDate()
            var year = date.getUTCFullYear()

            let orderObj = {
                deliveryDetails: {

                    name: order.name,
                    address: order.address,
                    pincode: order.pincode,
                    mobile: order.number,
                    email: order.email,
                },
                userId: objectId(order.userId),
                paymentMethord: order['payment-method'],
                products: products,
                totalAmount: total,
                date: year + "/" + month + "/" + day,
                time: new Date(),
                status: status
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(order.userId) })
                resolve(response)
            })


        })


    },

    getCartProductsList: (userId) => {
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) }).then((cart) => {
                resolve(cart.product)
            })

        })
    },



    getCatName: (name) => {
        console.log("hiiiiiiiiiiiiiiiiiiiiiiiii");
        return new Promise(async (resolve, reject) => {
            let pro = await db.get().collection(collection.PRODUCT_COLLECTION).find({ category: name }).toArray()
            resolve(pro)
        }) 


    },




    singleProductAmount: (userId) => {


        return new Promise(async (resolve, reject) => {
          

            let producttotal = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$product'
                },
                {
                    $project: {
                        item: '$product.item',
                        quantity: '$product.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $project: {

                        item: 1, quantity: 1, product: 1, total: { $sum: { $multiply: ['$quantity', '$product.price'] } }
                    }

                }

            ]).toArray()
            if (producttotal) {
                resolve(producttotal)
            } else {
                resolve()
            }
        })

    },



    getUserOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            console.log(userId);
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: objectId(userId) })
                .sort({ time: -1 })
                .toArray()
            resolve(orders)
        })
    },




    getOrderProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(orderId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',


                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }

            ]).toArray()
            resolve(orderItems)

        })
    },


    cancelOrderList: (id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(id) }, { $set: { status: false } }).then((cancel) => {
                resolve(cancel)

            })

        })
    },


    changePassword: (data, id) => {

        return new Promise(async (resolve, reject) => {

            console.log('change password000000000000000000000000000000');
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(id) })
            console.log(user);
            if (user) {

                bcrypt.compare(data.oldpass, user.password).then(async (status) => {
                    console.log(data);
                    if (status) {
                        let password = await bcrypt.hash(data.newpass, 10)
                        db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(id) }, {
                            $set: {
                                password: password
                            }
                        }).then((response) => {
                            response.status = true
                            resolve(response)
                        })
                        console.log('password');
                    } else {
                        console.log('failed 1');
                        resolve({ status: false })
                    }
                })
            } else {
                console.log('failed');
                resolve({ status: false })

            }
        })
    },


    generateRazorpay: (orderId, total) => {
        console.log(orderId);
        return new Promise((resolve, reject) => {
            var options = {
                amount: total * 100,
                currency: "INR",
                receipt: "" + orderId.insertedId
            }
            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("New Order :", order);
                    resolve(order)
                }
            })

        })
    },



    verifyPayment: (details) => {
        console.log(details);
        return new Promise((resolve, reject) => {
            const crypto = require('crypto')
            let hmac = crypto.createHmac('sha256', 'XR8HpjEDW4U4yk01pct2rnkA')

            hmac.update(details.payment.razorpay_order_id + '|' + details.payment.razorpay_payment_id)
            hmac = hmac.digest('hex')
            if (hmac == details.payment.razorpay_signature) {
                resolve()
            } else {
                reject()
            }
        })
    },

    changePaymentStatus: (orderId) => {
        console.log("hiiiiiiiiiiiiiiiiiiiiii");
        console.log(orderId);
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION)
                .updateOne({ _id: objectId(orderId) },
                    {
                        $set: {
                            status: 'Placed'
                        }
                    }
                ).then(() => {
                    resolve()
                })
        })
    },

    addToWhishlist: (productId, userId) => {
        let proObj = {
            item: objectId(productId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.WISH_COLLECTION).findOne({ user: objectId(userId) })
            if (userCart) {
                let proExist = userCart.product.findIndex(products => products.item == productId)

                if (proExist != -1) {
                    db.get().collection(collection.WISH_COLLECTION).updateOne({ user: objectId(userId), 'product.item': objectId(productId) },
                        {
                            $inc: { 'product.$.quantity': 1 }
                        }
                    ).then(() => {
                        resolve()

                    })

                } else {
                    db.get().collection(collection.WISH_COLLECTION).updateOne({ user: objectId(userId) },
                        {
                            $push: { product: proObj }
                        }


                    ).then((data) => {
                        resolve(data);
                    })
                }

            } else {
                console.log('OOIUUUUUU');
                let cartObj = {
                    user: objectId(userId),
                    product: [proObj]
                }
                db.get().collection(collection.WISH_COLLECTION).insertOne(cartObj).then((data) => {
                    resolve(data)

                })
            }

        })
    },

    getWishList: (userId) => {
        console.log("Commi11111111111111111111111111111111111111111111111111");
        console.log(userId);
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.WISH_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
               
                {
                    $project: {
                        item: '$product.item',

                    }
                }, {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'products'
                    }
                },
                {
                    $project: {
                        item: 1, product: { $arrayElemAt: ['$products', 0] }
                    }
                }
            ]).toArray()
            console.log(cartItems);
            resolve(cartItems)
        })
    },

    generatePaypal: (orderId, total) => {
        console.log(orderId);
        console.log(total);
        return new Promise((resolve, reject) => {

            const create_payment_json = {
                "intent": "sale",
                "payer": {
                    "payment_method": "paypal"
                },
                "redirect_urls": {
                    "return_url": "http://localhost:3000/success",
                    "cancel_url": "http://localhost:3000/cancel"
                },
                "transactions": [{
                    "item_list": {
                        "items": [{
                            "name": "Red Sox Hat",
                            "sku": "001",
                            "price": total,
                            "currency": "USD",
                            "quantity": 1
                        }]
                    },
                    "amount": {
                        "currency": "USD",
                        "total": total
                    },
                    "description": "Hat for the best team ever"
                }]
            }; 
            paypal.payment.create(create_payment_json, function (error, payment) {
                if (error) {
                    throw error;
                } else {
                   
                    resolve(payment)
                }
            });

        })
    },


    getTotal: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).findOne({ _id: objectId(orderId) }).then((response) => {
                resolve(response)
            })
        })
    },

    returnedstatus: (Orderid) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: ObjectId(Orderid) },
                {
                    $set: { status: 'Returned-request' }
                }).then(() => {
                    resolve()
                })
        })
    },

    getCoupon: (name,userid) => { 
        return new Promise(async (resolve, reject) => {
            let coupon = await db.get().collection(collection.COUPON_COLLECTION).findOne({ Couponname: name })
            console.log(coupon);
            if(coupon){
                db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userid)},{
               $set:{
                 couponname:coupon.Couponname,
                 couponoffer:coupon.Couponoffer
               }
            })
            resolve({status:true})
        }else{  
     resolve({status:false}) 
        }
            
                 
        })
    },

    getCoupons :(userid)=>{
     return new Promise(async (resolve,reject)=>{
        let coupon = await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userid)})
        console.log("kkkkkkkkkk");

        console.log(coupon);
       if(coupon.couponoffer){
            resolve(coupon)
        }else{
            resolve(false)
        }
        
     })
    },
    Coupon :(userid)=>{
        return new Promise(async (resolve,reject)=>{
           let coupon = await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userid)})
           console.log("kkkkkkkkkk");
   
           console.log(coupon);
          if(coupon.couponoffer){
              console.log("hiiihiihihhihihih");
               resolve(coupon)
           }else{
               resolve(false)
           }
           
        })
       },


       getReferal:(body)=>{
        return new Promise(async (resolve,reject)=>{
         db.get().collection(collection.USER_COLLECTION).findOne({referalcode:body.referal}).then((user)=>{
               if(user.referalAmount){
                resolve(user.referalAmount)
               }else{
                resolve(false)
               }
        
            
         }) 
        
         })
      
       },


       getReferalA:()=>{

       }

}


