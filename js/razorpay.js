const RAZORPAY_KEY_ID = "rzp_test_SzrlNr7UfRfPvr";

(function () {
  var DEFAULT_SIZE = "One Size";

  function createInput(name, placeholder, type) {
    var input = document.createElement("input");
    input.name = name;
    input.placeholder = placeholder;
    input.type = type || "text";
    input.style.background = "#0A0806";
    input.style.border = "1px solid rgba(242,237,228,0.1)";
    input.style.borderRadius = "0";
    input.style.color = "#F2EDE4";
    input.style.fontFamily = "Space Grotesk,sans-serif";
    input.style.fontSize = "1rem";
    input.style.padding = "0.9rem";
    input.style.width = "100%";
    return input;
  }

  function showModalError(modal, message) {
    var error = modal.querySelector("#modal-error");
    error.textContent = message;
    error.style.display = "block";
  }

  function validateForm(data) {
    if (!data.name.trim()) {
      return "Full name is required.";
    }

    if (!data.email.includes("@")) {
      return "Enter a valid email address.";
    }

    if (data.phone.replace(/\D/g, "").length < 10) {
      return "Enter a valid phone number.";
    }

    if (!data.address.trim()) {
      return "Full address is required.";
    }

    if (!/^\d{6}$/.test(data.pincode.trim())) {
      return "Pincode must be exactly 6 digits.";
    }

    return "";
  }

  function openDetailsModal(size) {
    var overlay = document.createElement("div");
    overlay.id = "order-modal";
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.zIndex = "1000";
    overlay.style.display = "grid";
    overlay.style.placeItems = "center";
    overlay.style.background = "rgba(10,8,6,0.95)";
    overlay.style.padding = "1rem";

    var panel = document.createElement("div");
    panel.style.position = "relative";
    panel.style.width = "min(92vw, 560px)";
    panel.style.maxHeight = "90vh";
    panel.style.overflow = "auto";
    panel.style.background = "#1C1712";
    panel.style.border = "1px solid rgba(242,237,228,0.08)";
    panel.style.padding = "2rem";

    var close = document.createElement("button");
    close.type = "button";
    close.textContent = "×";
    close.setAttribute("aria-label", "Close checkout details");
    close.style.position = "absolute";
    close.style.top = "1rem";
    close.style.right = "1rem";
    close.style.border = "0";
    close.style.background = "transparent";
    close.style.color = "#F2EDE4";
    close.style.cursor = "pointer";
    close.style.fontSize = "1.6rem";

    var eyebrow = document.createElement("p");
    eyebrow.textContent = "Mumbai Cap — Drop 001";
    eyebrow.style.color = "#E8610A";
    eyebrow.style.fontFamily = "Space Mono,monospace";
    eyebrow.style.fontSize = "0.78rem";
    eyebrow.style.margin = "0 0 0.75rem";
    eyebrow.style.textTransform = "uppercase";

    var heading = document.createElement("h2");
    heading.textContent = "Your Details";
    heading.style.color = "#F2EDE4";
    heading.style.fontFamily = "Playfair Display,serif";
    heading.style.fontSize = "3rem";
    heading.style.lineHeight = "1";
    heading.style.margin = "0 0 1.5rem";

    var form = document.createElement("form");
    form.style.display = "grid";
    form.style.gap = "0.9rem";

    var name = createInput("name", "Full Name");
    var email = createInput("email", "Email", "email");
    var phone = createInput("phone", "Phone", "tel");
    var address = createInput("address", "Full Address");
    var pincode = createInput("pincode", "Pincode", "text");

    var error = document.createElement("p");
    error.id = "modal-error";
    error.style.color = "#E8610A";
    error.style.display = "none";
    error.style.fontFamily = "Space Grotesk,sans-serif";
    error.style.fontSize = "0.9rem";
    error.style.margin = "0";

    var proceed = document.createElement("button");
    proceed.type = "submit";
    proceed.textContent = "Proceed to Payment — ₹1,999";
    proceed.style.background = "#E8610A";
    proceed.style.border = "1px solid #E8610A";
    proceed.style.color = "#0A0806";
    proceed.style.cursor = "pointer";
    proceed.style.fontFamily = "Space Mono,monospace";
    proceed.style.fontWeight = "700";
    proceed.style.padding = "0.95rem 1rem";
    proceed.style.textTransform = "uppercase";

    form.append(name, email, phone, address, pincode, error, proceed);
    panel.append(close, eyebrow, heading, form);
    overlay.append(panel);
    document.body.append(overlay);

    function closeModal() {
      overlay.remove();
    }

    close.addEventListener("click", closeModal);
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) {
        closeModal();
      }
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var data = {
        name: name.value,
        email: email.value,
        phone: phone.value,
        address: address.value,
        pincode: pincode.value,
        size: size
      };
      var validationError = validateForm(data);

      if (validationError) {
        showModalError(overlay, validationError);
        return;
      }

      var orderDetails = data;

      var options = {
        key: RAZORPAY_KEY_ID,
        amount: 199900,
        currency: "INR",
        name: "Daymn Wear",
        description: "Mumbai Cap — Drop 001",
        theme: { color: "#E8610A" },
        prefill: {
          name: data.name,
          email: data.email,
          contact: data.phone
        },
        handler: async function(response) {
          try {
            await window.DaymnDB.saveOrder({
              ...orderDetails,
              paymentId: response.razorpay_payment_id,
              amount: 1999
            });
          } catch(e) {
            console.error('Order save failed:', e);
          }

          try {
            await window.DaymnDB.incrementInventory();
          } catch(e) {
            console.error('Inventory update failed:', e);
          }

          const modal = document.getElementById('order-modal');
          if (modal) modal.remove();

          window.location.href =
            'order-confirm.html?id=' + response.razorpay_payment_id +
            '&size=' + encodeURIComponent(orderDetails.size) +
            '&amount=1999';
        }
      };

      if (!window.Razorpay) {
        showModalError(overlay, "Payment is not available right now. Please try again later.");
        return;
      }

      var checkout = new window.Razorpay(options);
      checkout.on("payment.failed", function () {
        showModalError(overlay, "Payment failed. Please try again.");
      });
      checkout.open();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".add-to-cart").forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();

        openDetailsModal(DEFAULT_SIZE);
      });
    });

    if (document.getElementById("inventory-count")) {
      window.DaymnDB.updateInventoryCounter();
    }
  });
})();
