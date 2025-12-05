const db = require('../db');

//Process subscriptions that are due today and create transactions

async function processDueSubscriptions() {
  try {
    console.log('Checking for due subscriptions...');

    // Get all active subscriptions that are due today or overdue
    const [dueSubscriptions] = await db.query(`
      SELECT 
        us.user_id,
        s.sub_id,
        s.sub_name,
        s.price,
        s.frequency,
        s.next_renewal
      FROM User_Subscription us
      JOIN Subscriptions s ON us.sub_id = s.sub_id
      WHERE us.active = 1
      AND s.next_renewal <= CURRENT_DATE()
    `);

    if (dueSubscriptions.length === 0) {
      console.log('No subscriptions due today.');
      return;
    }

    console.log(`Found ${dueSubscriptions.length} subscription(s) to process.`);

    for (const sub of dueSubscriptions) {
      try {
        // Get the user's expense category (or create a default one)
        let [categories] = await db.query(`
          SELECT category_id 
          FROM Categories 
          WHERE user_id = ? AND kind = 'expense' 
          LIMIT 1
        `, [sub.user_id]);

        let categoryId;
        
        if (categories.length === 0) {
          // Create a default expense category for this user
          const [result] = await db.query(`
            INSERT INTO Categories (user_id, name, kind)
            VALUES (?, 'Subscription', 'expense')
          `, [sub.user_id]);
          categoryId = result.insertId;
        } else {
          categoryId = categories[0].category_id;
        }

        // Create the transaction
        await db.query(`
          INSERT INTO Transactions (user_id, category_id, amount, date, vendor)
          VALUES (?, ?, ?, CURRENT_DATE(), ?)
        `, [sub.user_id, categoryId, sub.price, sub.sub_name]);

        // Calculate next renewal date based on frequency
        let nextRenewal;
        switch (sub.frequency) {
          case 'daily':
            nextRenewal = 'DATE_ADD(CURRENT_DATE(), INTERVAL 1 DAY)';
            break;
          case 'weekly':
            nextRenewal = 'DATE_ADD(CURRENT_DATE(), INTERVAL 1 WEEK)';
            break;
          case 'monthly':
            nextRenewal = 'DATE_ADD(CURRENT_DATE(), INTERVAL 1 MONTH)';
            break;
          case 'yearly':
            nextRenewal = 'DATE_ADD(CURRENT_DATE(), INTERVAL 1 YEAR)';
            break;
          default:
            nextRenewal = 'DATE_ADD(CURRENT_DATE(), INTERVAL 1 MONTH)';
        }

        // Update the subscription's next_renewal date
        await db.query(`
          UPDATE Subscriptions
          SET next_renewal = ${nextRenewal}
          WHERE sub_id = ?
        `, [sub.sub_id]);

        console.log(`✓ Processed subscription: ${sub.sub_name} for user ${sub.user_id} ($${sub.price})`);
      } catch (err) {
        console.error(`Error processing subscription ${sub.sub_id}:`, err);
      }
    }

    console.log('Subscription processing complete.');
  } catch (err) {
    console.error('Error in processDueSubscriptions:', err);
  }
}

//Start the daily subscription processor

function startSubscriptionProcessor() {
  // Run immediately on startup
  processDueSubscriptions();

  // Calculate time until next midnight
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const msUntilMidnight = tomorrow - now;

  // Schedule first run at midnight
  setTimeout(() => {
    processDueSubscriptions();
    // Then run every 24 hours
    setInterval(processDueSubscriptions, 24 * 60 * 60 * 1000);
  }, msUntilMidnight);

  console.log('Subscription processor scheduled to run daily at midnight.');
}

module.exports = { processDueSubscriptions, startSubscriptionProcessor };
