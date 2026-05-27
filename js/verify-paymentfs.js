async function startPayment(totalAmount) {

  try {

    // call backend create-order API
    const response = await fetch(
      "https://storeapi-xl4c.vercel.app/api/createorder",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          amount: totalAmount
        })
      }
    );

    const data = await response.json();

    if (!data.success) {

      alert("Order creation failed");

      return;

    }

    const order = data.order;

    // razorpay popup options
    const options = {

      key: "YOUR_RAZORPAY_PUBLIC_KEY",

      amount: order.amount,

      currency: order.currency,

      order_id: order.id,

      name: "Your Grocery Store",

      description: "Order Payment",

      handler: async function (response) {

        await verifyPayment(response);

      },

      theme: {
        color: "#3399cc"
      }

    };

    // open razorpay popup
    const rzp = new Razorpay(options);

    rzp.open();

  } catch (error) {

    console.log(error);

  }
}