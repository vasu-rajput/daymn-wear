const SUPABASE_URL = "https://jlbkclompcwlwuxtyiit.supabase.co/rest/v1/";
const SUPABASE_ANON_KEY = "sb_publishable_BW-RL9mazT4V8rTwymZvyQ_FBImJlX2";
const TOTAL_DROPS = 100;
const PRODUCT_ID = "mumbai-cap";

(function () {
  var supabaseClient = window.supabase
    ? window.supabase.createClient(SUPABASE_URL.replace(/\/rest\/v1\/?$/, ""), SUPABASE_ANON_KEY)
    : null;
  var client = supabaseClient;

  function requireClient() {
    if (!client) {
      throw new Error("Supabase is not configured yet.");
    }

    return client;
  }

  async function saveOrder(orderData) {
    console.log('Attempting to save order:', orderData);

    const { data, error } = await supabaseClient
      .from('orders')
      .insert({
        name: orderData.name,
        email: orderData.email,
        phone: orderData.phone,
        size: orderData.size,
        address: orderData.address,
        pincode: orderData.pincode,
        payment_id: orderData.paymentId,
        amount: orderData.amount,
        status: 'paid',
        shipped: false
      });

    console.log('Supabase response — data:', data, 'error:', error);

    if (error) {
      console.error('Supabase error details:', JSON.stringify(error));
      throw error;
    }
    return data;
  }

  async function getInventory() {
    var db = requireClient();
    var result = await db
      .from("inventory")
      .select("sold")
      .eq("product", PRODUCT_ID)
      .single();

    if (result.error) {
      throw result.error;
    }

    return Number(result.data && result.data.sold ? result.data.sold : 0);
  }

  async function incrementInventory() {
    console.log('Attempting inventory increment...');

    const { data: current, error: fetchError } = await supabaseClient
      .from('inventory')
      .select('sold')
      .eq('product', 'mumbai-cap')
      .single();

    console.log('Current inventory:', current, 'Fetch error:', fetchError);

    if (fetchError) throw fetchError;

    const newSold = (current.sold || 0) + 1;
    console.log('Updating sold to:', newSold);

    const { data, error: updateError } = await supabaseClient
      .from('inventory')
      .update({ sold: newSold })
      .eq('product', 'mumbai-cap')
      .select();

    console.log('Update result:', data, 'Update error:', updateError);

    if (updateError) throw updateError;
    return data;
  }

  async function getAllOrders() {
    var db = requireClient();
    var result = await db.from("orders").select("*").order("created_at", { ascending: false });

    if (result.error) {
      throw result.error;
    }

    return result.data;
  }

  async function updateShipped(orderId) {
    var db = requireClient();
    var current = await db.from("orders").select("shipped").eq("id", orderId).single();

    if (current.error) {
      throw current.error;
    }

    var result = await db
      .from("orders")
      .update({ shipped: !current.data.shipped })
      .eq("id", orderId)
      .select()
      .single();

    if (result.error) {
      throw result.error;
    }

    return result.data;
  }

  async function updateInventoryCounter() {
    var counter = document.getElementById("inventory-count");

    if (!counter) {
      return;
    }

    try {
      var sold = await getInventory();
      var remaining = Math.max(0, TOTAL_DROPS - sold);
      counter.textContent = remaining + " of " + TOTAL_DROPS + " remaining";
      counter.style.color = remaining < 20 ? "#E8610A" : "#F2EDE4";
    } catch (error) {
      counter.textContent = "Inventory update unavailable";
      counter.style.color = "rgba(242,237,228,0.4)";
    }
  }

  window.DaymnDB = {
    saveOrder: saveOrder,
    getInventory: getInventory,
    incrementInventory: incrementInventory,
    getAllOrders: getAllOrders,
    updateShipped: updateShipped,
    updateInventoryCounter: updateInventoryCounter
  };
})();
