var express = require('express');
var router = express.Router();
var productHelper = require('../helpers/user-helper')
const userHelper = require('../helpers/user-helper');
const otp = require("../config/otp");
const { redirect } = require('express/lib/response');
const req = require('express/lib/request');
const res = require('express/lib/response');
const adminHelper = require('../helpers/admin-helper');
const client = require("twilio")(otp.accountSID, otp.authToken)



//........................middlewear......................
// const adminLogin= (req, res, next)=>{

//   if(req.session.logIn){

//    next()
//   }else{

//       res.redirect('/home ')
//   }
// }


//..........................user-profile...............

router.get('/user-profile', (req, res) => {
  if (req.session.userData) {
    res.render('user/user-profile', { user: true, userData: req.session.userData });
  } else {
    res.redirect('/')
  }

});

/* GET users listing. */
router.get('/', function (req, res) {

  res.render('home', { user: true, userData: req.session.userData });
});


//login get 
router.get('/login', (req, res) => {
  if (req.session.userData) {
    res.redirect('/')
  }
  res.render('user/login', { logginErr: req.session.logginErr });
  req.session.logginErr = null

});

//login post

// router.post('/login', (req, res) => {
 
//   userHelper.doLogin(req.body).then((response) => {
//     if (response.status) {

//       req.session.loggedIn = true
//       req.session.userData = response.user
//       res.redirect('/verify')
//     } else {
//       req.session.logginErr = "Invalid Username or Password"
//       res.redirect('/login')

//     }
//   })
// });



//................................login with otp......................................................................................................................................


router.post('/login',  (req, res) => {
  userHelper.doLogin(req.body).then((response) => {
    console.log(response);
    req.session.phone=response.user?.phone
    console.log('vannu')
    let user = response.user
    if (response.status) {
      console.log('mmmmmmmmmmmm');
      console.log(user.phone);
     // req.session.login = true
     // req.session.user = response.user
      var Number = response.phone
      client.verify
      .services(otp.serviceSID)
      .verifications
      .create({
        to:`+91${user.phone}`,
        channel:'sms'
      })
      .then((data)=>{
      
       req.session.loggedin = true
       req.session.userData = response.user
console.log(user)
        console.log(data+'iam line 40 data');
        res.redirect('/verify')
      })
      
    } else {
      req.session.loginErr = 'Invalid username or password'
      res.redirect('/login')
    }
  })
})


//signup get 
router.get('/signup', (req, res) => {
  if(req.session.userData){
    res.redirect('/')
  }else{
  res.render('user/signup', { signinErr: req.session.signinErr });
  req.session.signinErr = null 
}
});

//signup post


router.post('/signup', function (req, res, next) {
  userHelper.signUp(req.body).then((response) => {
    if (response.status) {
      req.session.signinErr = "Email allready exits"
      res.redirect('/signup')
    } else {
      userHelper.doSignup(req.body).then((response) => {  
        
        res.redirect('/login')

      })
    }
  })
})

//verify get 
router.get('/verify', (req, res) => {
  if (req.session.login) {
res.redirect('/')
  
  } else {
    const Number = req.session.phone
  res.render('user/verify', { header: true, Number,userData: req.session.userData });
  }
});



// //verify post
// router.post('/verify', (req, res) => {
//   if (req.body.otp == "1234") {
//     console.log(otp);
//     res.redirect('/')
//   }
//   res.redirect('/verify');
// });


//................................verify with otp......................................................................................................................................

router.post('/verify', (req, res) => {
  var Number =req.session.phone
  console.log(Number);
  var Otp = req.body.otp

  console.log(Otp);

  client.verify
    .services(otp.serviceSID)
    .verificationChecks.create({
      to: `+91${Number}`,
      code: Otp
    })
    .then((data) => {
      console.log(data.status + "otp status/*/*/*/");
      if(data.status=='approved'){
          req.session.login = true
        res.redirect("/");
      }else{
        console.log(data.status+'no booyy');
        otpErr = 'Invalid OTP'
        res.render('user/verify',{otpErr,Number,header:true})
      }

});

})





//logout get 
router.get('/logout', function (req, res) {
  req.session.destroy()
  res.redirect('/')
})




//shop  get 
router.get('/shop', (req, res) => {
  if (req.session.userData) {
    adminHelper.getAllProduct().then((product)=>{
      res.render('user/shop', { user: true, userData: req.session.userData,product });
    })
    
  }else{
    res.redirect('/')
  }
})



//..............................single-product.............................................
router.get('/single-product', (req, res) => {
  if (req.session.userData) {
    res.render('user/single-product', { user: true, userData: req.session.userData });
  } else {
    res.redirect('/')
  }

});

module.exports = router;
