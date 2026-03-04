# Testing with Real UPI Payments

Guide for testing the app with actual UPI QR codes and real users.

---

## Prerequisites

1. **Two devices or browsers** – One for Requester, one for Payee (or use incognito for a second session)
2. **Real UPI app** – PhonePe, Google Pay, Paytm, or BHIM on your phone
3. **Real UPI QR code** – From a merchant, friend, or generate one from your UPI app

---

## How to Get a Real UPI QR Code

### Option 1: From your UPI app
- Open **PhonePe** or **Google Pay**
- Go to **Receive** or **Request money**
- Your QR code appears – take a screenshot or ask someone to scan it
- Use that screenshot when testing "Upload from Gallery"

### Option 2: From a merchant
- Use any UPI QR at a shop, restaurant, or online
- Take a photo of the QR code
- Use the photo when testing

### Option 3: Generate a test UPI link
- UPI links look like: `upi://pay?pa=username@paytm&pn=Name&am=100&cu=INR`
- You can create a QR from this using free online QR generators (e.g. qr-code-generator.com)
- Use a real UPI ID (e.g. your phone number linked to UPI)

---

## Real Payment Test Flow

### Step 1: Requester creates a request

1. **Sign in as Requester** (or stay logged out – you can still submit)
2. Go to **New Request**
3. **Scan QR** or **Upload from Gallery**:
   - Use a real UPI QR (e.g. your own "Receive" QR from PhonePe/GPay)
   - Or a merchant’s QR
4. Enter your **email** (so the payee sees who requested)
5. Select **Category**
6. Click **Send Request**
7. You should see "Waiting for Payee"

### Step 2: Payee claims and pays

1. On another device/browser, **Sign in as Payee**
2. Go to **Payee Dashboard**
3. You should see the request with **"Requested by: [email]"**
4. Click **Claim**
5. You’ll be redirected to the UPI link (PhonePe/GPay will open on mobile)
6. **Complete the payment** in the UPI app
7. Return to the browser (Back button or reopen the app)
8. Click **Confirm Payment**
9. Balance is deducted; request is marked paid

### Step 3: Verify

- **Requester**: Request shows as completed (you could add a "My Requests" view later)
- **Payee**: Request disappears from the list; balance decreased
- **Actual UPI**: Money was sent to the UPI ID in the QR

---

## Testing on Mobile

For the best experience with real UPI:

1. **Deploy the app** (e.g. Vercel) so you have an HTTPS URL
2. Or use **ngrok** to expose localhost: `ngrok http 3000`
3. Open the ngrok URL on your phone
4. Camera will work for scanning real QR codes
5. When you Claim, the UPI app will open directly on your phone

---

## Common QR Issues

| Issue | Solution |
|-------|----------|
| "No QR code found" | Ensure the image is clear, well-lit, and the QR is fully visible |
| Wrong amount extracted | Some QRs don’t include amount; you can edit after scanning (future feature) |
| UPI link doesn’t open | On desktop, the link may open in the browser; on mobile it should open the UPI app |
| Payment completed but app doesn’t know | The app relies on you pressing Back and then "Confirm Payment" – there’s no automatic callback from UPI apps |

---

## Security Note

When testing with real payments:
- Use small amounts (e.g. ₹1)
- Use your own UPI IDs for both Requester and Payee when possible
- The Payee’s balance is separate from the actual UPI payment – the app tracks internal balance for reconciliation
