async function verifyPayment(paymentData) {

  try {

    const response = await fetch(
      "https://YOUR_BACKEND_URL.vercel.app/api/verify-payment",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify(paymentData)
      }
    );

    const data = await response.json();

    if (data.success) {

      alert("Payment Successful");

      // SAVE ORDER TO FIRESTORE HERE

      // redirect if needed
      // window.location.href = "/success.html";

    } else {

      alert("Payment Verification Failed");

    }

  } catch (error) {

    console.log(error);

  }
}