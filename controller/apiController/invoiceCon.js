const AWS = require("aws-sdk");
const bcrypt = require("bcryptjs");
const tokens = require("../../config/tokens");
const { admin } = require("../../config/fbConfig");
const Retailer = require("../../model/retailer");
const Orders = require("../../model/orders");
const Users = require("../../model/users");
const Invoice = require("../../model/invoice");
const moment = require("moment");
var easyinvoice = require("easyinvoice");
const fs = require("fs");
const PDFDocument = require("pdfkit");

module.exports = {
  generateInvoice: async (req, res) => {
    try {
      const { orderId, retailer_id, cgst, sgst, igst } = req.body;
      if (retailer_id && retailer_id !== "") {
        const retailersOrder = await Orders.findById(orderId).populate(
          "orders.product"
        );
        let product_price = 0;

        retailersOrder.orders.map((order) => {
          product_price += parseInt(order.product.totalAmount);
        });

        const user_details = await Users.findById(retailersOrder.userId);

        const today = new Date();
        let date =
          today.getFullYear() +
          "-" +
          (today.getMonth() + 1) +
          "-" +
          today.getDate();

        const getTotaldata = await Invoice.countDocuments({});
        const str = "0";
        const genId =
          "INV" +
          moment(new Date()).format("YYMMDD") +
          str.repeat(8 - getTotaldata.toString().length) +
          (getTotaldata + 1);
        const invoice = new Invoice({
          invoice_number: genId,
          orderIdForInv: retailersOrder.OrderId,
          orderId: orderId,
          userId: retailersOrder.userId,
          retailerId: retailersOrder.retailerId,
          invoice_date: date,
          product_price: product_price,
          cgst,
          sgst,
          igst,
          discounted_price: retailersOrder.total_order_discount_price,
          customer_name: user_details.name,
          customer_address: retailersOrder.orders[0].delivered_at,
          customer_phoneNo: user_details.phone,
          customer_email: user_details.email,
          total_amount: product_price,
          payment_option: retailersOrder.payment_option,
        });
        const data = await invoice.save();
        const Data = await Invoice.findById(data._id);
        await Orders.findByIdAndUpdate(
          orderId,
          {
            invoiceId: data._id,
          },
          { new: true }
        );
        res.status(200).json({ status: "success", data: Data });
        // if (retailersOrder.length === 0) {
        //   res.status(200).json({
        //     status: "success",
        //     message: "No Orders Found",
        //   });
        // } else {
        //   res
        //     .status(200)
        //     .json({ status: "success", allOrders: retailersOrder });
        // }
      } else {
        res.status(203).json({ status: "error", error: "retailerId missing" });
      }
    } catch (error) {
      res.status(400).json({ status: "error", error: error.message });
    }
  },

  getInvoice: async (req, res) => {
    try {
      const { invoiceId } = req.body;
      if (invoiceId && invoiceId !== "") {
        const invoiceDetails = await Invoice.findById(invoiceId)
          .populate({
            path: "orderId",
            populate: {
              path: "orders.product",
            },
          })
          .populate(
            "retailerId",
            "retailerName addressLine1 addressLine2 state pincode country phone city"
          )
          .populate("userId", "name phone");
        const products = [];
        invoiceDetails.orderId.orders.map((order) => {
          // console.log(order);
          // console.log(order.product);
          const product = {
            quantity: order.quantity,
            description: order.product.description,
            price: order.product.price,
            discount: order.product.discount,
            totalAmount: order.product.totalAmount,
          };
          products.push(product);
        });
        // var data = {
        //   //"documentTitle": "RECEIPT", //Defaults to INVOICE
        //   currency: "INR",
        //   taxNotation: "GST", //or gst
        //   marginTop: 25,
        //   marginRight: 25,
        //   marginLeft: 25,
        //   marginBottom: 25,
        //   logo: "https://www.easyinvoice.cloud/img/logo.png", //or base64
        //   //"logoExtension": "png", //only when logo is base64
        //   sender: {
        //     company: "R-Grow",
        //     address: "Kolkata",
        //     zip: "700094",
        //     city: "Kolkata",
        //     country: "India",
        //     //"custom1": "custom value 1",
        //     //"custom2": "custom value 2",
        //     //"custom3": "custom value 3"
        //   },
        //   client: {
        //     company: invoiceDetails.retailerId.retailerName,
        //     address: invoiceDetails.retailerId.addressLine1,
        //     zip: invoiceDetails.retailerId.pincode,
        //     city: invoiceDetails.retailerId.city,
        //     country: invoiceDetails.retailerId.country,
        //     //"custom1": "custom value 1",
        //     //"custom2": "custom value 2",
        //     //"custom3": "custom value 3"
        //   },
        //   invoiceNumber: invoiceDetails.invoice_number,
        //   invoiceDate: invoiceDetails.invoice_date,
        //   products: products,
        //   bottomNotice: "Kindly pay your invoice within 15 days.",
        // };
        // easyinvoice.createInvoice(data, async (result) => {
        //   // console.log(result);
        //   // var pdf = result.pdf;
        //   // console.log(pdf);
        //   easyinvoice.download("myInvoice.pdf", result.pdf);

        //   //Now let's save our invoice to our local filesystem
        //   // fs.writeFileSync("invoice.pdf", pdf, "base64");
        //   // console.log(result.pdf);
        // });

        const invoice = {
          shipping: {
            name: "John Doe",
            address: "1234 Main Street",
            city: "San Francisco",
            state: "CA",
            country: "US",
            postal_code: 94111,
          },
          items: [
            {
              item: "TC 100",
              description: "Toner Cartridge",
              quantity: 2,
              amount: 6000,
            },
            {
              item: "USB_EXT",
              description: "USB Cable Extender",
              quantity: 1,
              amount: 2000,
            },
          ],
          subtotal: 8000,
          paid: 0,
          invoice_nr: 1234,
        };

        let doc = new PDFDocument({ size: "A4", margin: 50 });

        generateHeader(doc);
        generateCustomerInformation(doc, invoice);
        generateInvoiceTable(doc, invoice);
        generateFooter(doc);

        doc.end();
        // doc.pipe(fs.createWriteStream(path));
        doc.pipe(fs.createWriteStream("invoice.pdf"));

        // console.log(data);
        // res.status(200).json({ status: "success", invoiceDetails: result });
      }
    } catch (error) {
      res.status(400).json({ status: "error", error: error });
    }
  },
};
function generateHeader(doc) {
  doc
    .image("", 50, 45, { width: 50 })
    .fillColor("#444444")
    .fontSize(20)
    .text("ACME Inc.", 110, 57)
    .fontSize(10)
    .text("ACME Inc.", 200, 50, { align: "right" })
    .text("123 Main Street", 200, 65, { align: "right" })
    .text("New York, NY, 10025", 200, 80, { align: "right" })
    .moveDown();
}

function generateCustomerInformation(doc, invoice) {
  doc.fillColor("#444444").fontSize(20).text("Invoice", 50, 160);

  generateHr(doc, 185);

  const customerInformationTop = 200;

  doc
    .fontSize(10)
    .text("Invoice Number:", 50, customerInformationTop)
    .font("Helvetica-Bold")
    .text(invoice.invoice_nr, 150, customerInformationTop)
    .font("Helvetica")
    .text("Invoice Date:", 50, customerInformationTop + 15)
    .text(formatDate(new Date()), 150, customerInformationTop + 15)
    .text("Balance Due:", 50, customerInformationTop + 30)
    .text(
      formatCurrency(invoice.subtotal - invoice.paid),
      150,
      customerInformationTop + 30
    )

    .font("Helvetica-Bold")
    .text(invoice.shipping.name, 300, customerInformationTop)
    .font("Helvetica")
    .text(invoice.shipping.address, 300, customerInformationTop + 15)
    .text(
      invoice.shipping.city +
        ", " +
        invoice.shipping.state +
        ", " +
        invoice.shipping.country,
      300,
      customerInformationTop + 30
    )
    .moveDown();

  generateHr(doc, 252);
}

function generateInvoiceTable(doc, invoice) {
  let i;
  const invoiceTableTop = 330;

  doc.font("Helvetica-Bold");
  generateTableRow(
    doc,
    invoiceTableTop,
    "Item",
    "Description",
    "Unit Cost",
    "Quantity",
    "Line Total"
  );
  generateHr(doc, invoiceTableTop + 20);
  doc.font("Helvetica");

  for (i = 0; i < invoice.items.length; i++) {
    const item = invoice.items[i];
    const position = invoiceTableTop + (i + 1) * 30;
    generateTableRow(
      doc,
      position,
      item.item,
      item.description,
      formatCurrency(item.amount / item.quantity),
      item.quantity,
      formatCurrency(item.amount)
    );

    generateHr(doc, position + 20);
  }

  const subtotalPosition = invoiceTableTop + (i + 1) * 30;
  generateTableRow(
    doc,
    subtotalPosition,
    "",
    "",
    "Subtotal",
    "",
    formatCurrency(invoice.subtotal)
  );

  const paidToDatePosition = subtotalPosition + 20;
  generateTableRow(
    doc,
    paidToDatePosition,
    "",
    "",
    "Paid To Date",
    "",
    formatCurrency(invoice.paid)
  );

  const duePosition = paidToDatePosition + 25;
  doc.font("Helvetica-Bold");
  generateTableRow(
    doc,
    duePosition,
    "",
    "",
    "Balance Due",
    "",
    formatCurrency(invoice.subtotal - invoice.paid)
  );
  doc.font("Helvetica");
}

function generateFooter(doc) {
  doc
    .fontSize(10)
    .text(
      "Payment is due within 15 days. Thank you for your business.",
      50,
      780,
      { align: "center", width: 500 }
    );
}

function generateTableRow(
  doc,
  y,
  item,
  description,
  unitCost,
  quantity,
  lineTotal
) {
  doc
    .fontSize(10)
    .text(item, 50, y)
    .text(description, 150, y)
    .text(unitCost, 280, y, { width: 90, align: "right" })
    .text(quantity, 370, y, { width: 90, align: "right" })
    .text(lineTotal, 0, y, { align: "right" });
}

function generateHr(doc, y) {
  doc.strokeColor("#aaaaaa").lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
}

function formatCurrency(cents) {
  return "$" + (cents / 100).toFixed(2);
}

function formatDate(date) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return year + "/" + month + "/" + day;
}
