(function () {
  var nav = document.querySelector(".site-nav");
  var menuToggle = document.querySelector(".menu-toggle");
  var header = document.querySelector(".site-header");

  if (nav && menuToggle) {
    menuToggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  function updateHeaderState() {
    var isScrolled = window.scrollY > 80;

    if (header) {
      header.classList.toggle("scrolled", isScrolled);
    }

    if (nav) {
      nav.classList.toggle("scrolled", isScrolled);
    }
  }

  updateHeaderState();
  window.addEventListener("scroll", updateHeaderState, { passive: true });

  var revealElements = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    revealElements.forEach(function (element) {
      revealObserver.observe(element);
    });
  } else {
    revealElements.forEach(function (element) {
      element.classList.add("visible");
    });
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (event) {
      var targetId = link.getAttribute("href");

      if (!targetId || targetId === "#") {
        return;
      }

      var target = document.querySelector(targetId);

      if (!target) {
        return;
      }

      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });

      if (nav && nav.classList.contains("open")) {
        nav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });
  });

  if (window.matchMedia("(pointer: fine)").matches) {
    var cursor = document.createElement("div");
    cursor.className = "custom-cursor";
    document.body.appendChild(cursor);

    window.addEventListener(
      "mousemove",
      function (event) {
        cursor.style.transform =
          "translate3d(" + event.clientX + "px, " + event.clientY + "px, 0)";
      },
      { passive: true }
    );
  }

  var currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".site-nav a").forEach(function (link) {
    if (link.getAttribute("href") === currentPage) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }
  });

  document.querySelectorAll(".product-form").forEach(function (form) {
    if (form.querySelector(".add-to-cart")) {
      return;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var productId = form.getAttribute("data-product-id");
      var quantityInput = form.querySelector("[name='quantity']");
      var message = form.querySelector(".form-message");
      var quantity = quantityInput ? Number(quantityInput.value) : 1;

      window.DaymnShopify.addToCart(productId, quantity);

      if (message) {
        message.textContent = "Added to cart. Checkout wiring can connect here when Shopify is ready.";
      }
    });
  });

  document.querySelectorAll('.size-btn').forEach(function(btn){btn.addEventListener('click',function(){document.querySelectorAll('.size-btn').forEach(function(b){b.classList.remove('selected')});btn.classList.add('selected');var e=document.getElementById('size-error');if(e)e.style.display='none'})});

  var orderSummary = document.querySelector(".order-confirm-card");
  if (orderSummary) {
    const params = new URLSearchParams(window.location.search);
    const paymentId = params.get('id') || 'N/A';
    const size = params.get('size') || 'N/A';
    const amount = params.get('amount') ? '₹' + Number(params.get('amount')).toLocaleString('en-IN') : 'N/A';
    var paymentTarget = document.getElementById("confirm-payment-id");
    var sizeTarget = document.getElementById("confirm-size");
    var amountTarget = document.getElementById("confirm-amount");
    var shareButton = document.getElementById("share-drop");
    var shareFeedback = document.getElementById("share-feedback");

    if (paymentTarget) paymentTarget.textContent = paymentId;
    if (sizeTarget) sizeTarget.textContent = size;
    if (amountTarget) amountTarget.textContent = amount;

    if (shareButton) {
      shareButton.addEventListener("click", function () {
        var shareData = {
          title: "Daymn Wear",
          text: "I just got the Mumbai Cap — Drop 001.",
          url: window.location.href
        };

        if (navigator.share) {
          navigator.share(shareData);
          return;
        }

        navigator.clipboard.writeText(window.location.href).then(function () {
          if (shareFeedback) {
            shareFeedback.textContent = "Link copied!";
          }
        });
      });
    }
  }
})();
