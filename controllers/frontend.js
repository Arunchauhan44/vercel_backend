const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { Module } = require("vm");

const prisma = new PrismaClient();



// module.exports.shopPage = async (req, res) => {
//   try {
//     const productLine1 = await prisma.product.findMany({ take: 3 });
//     const productLine2 = await prisma.product.findMany({ skip: 3, take: 3 });
//     const productLine3 = await prisma.product.findMany({ skip: 6, take: 3 });
//     const productLine4 = await prisma.product.findMany({ skip: 9, take: 3 });
//     res.render("shop", {
//       productLine1,
//       productLine2,
//       productLine3,
//       productLine4,
//     });
//   } catch (error) {
//     res.status(404).send("error while loading the shop page");
//   }
// };

// module.exports.aboutPage = async (req, res) => {
//   try {
//     res.render("about");
//   } catch (error) {
//    return res.status(404).send("error while loading the shop page");
//   }
// };

// const contactPage = async (req, res) => {
//   try {
//     res.render("contact");
//   } catch (error) {
//    return res.status(404).send("error while loading the shop page");
//   }
// };


module.exports.signinPage = async (req, res) => {
  try {
   return res.render("signIn", { activePage: 'signup' });
  } catch (error) {
   return res.status(404).send("error while loading the shop page");
  }
};

module.exports.loginPage = async (req, res) => {
  try {
   return res.render("login", { activePage: 'signup' });
  } catch (error) {
   return res.status(404).send("error while loading the shop page");
  }
};

module.exports.resetPage = async (req, res) => {
  try {
    return res.render("reset");
    
  } catch (error) {
    return res.status(404).send("error while loading the shop page");    
  }
}

module.exports.forgotPage = async (req, res) => {
  try {
    return res.render("forgot");
  } catch (error) {
    return res.status(404).send("error while loading the shop page");    
    
  }
}

module.exports.productPage = async (req, res) => {
  try {
    const productLine1 = await prisma.product.findMany({ take: 3 });
    const productLine2 = await prisma.product.findMany({ skip: 3, take: 3 });
    const productLine3 = await prisma.product.findMany({ skip: 6, take: 3 });
    const productLine4 = await prisma.product.findMany({ skip: 9, take: 3 });
    res.render("product", {
      productLine1,
      productLine2,
      productLine3,
      productLine4,
    },
  );
  } catch (error) {
    console.log(error);
   return res.status(404).send("error while loading the home page");
  }
};

module.exports.homepage = async (req, res) => {
  try {
    return res.render("home.ejs");
  } catch (error) {
    console.log(error);
   return res.status(404).send("error while loading the home page");
    
  }
}


module.exports.navbar = async (req, res) => {
  try {
    return res.render("navbar");
  } catch (error) {
    console.log(error);
   return res.status(404).send("error while loading the home page");
    
  }
}


// const profilePage = async (req, res) => {
//     try {
//         res.render("profile");
//     } catch (error) {
//         res.status(404).send('error while loading the shop page');
//     }
// };

// const cartPage = async (req, res) => {
//     try {
//         res.render("cart");
//     } catch (error) {
//         res.status(404).send('error while loading the shop page');
//     }
// };

