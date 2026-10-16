# Setting up Tulpar chat on Firebase

About 15 minutes, free (Spark plan, no card needed). You need a Google account.

## 1. Create the project
1. Go to https://console.firebase.google.com and click **Create a project**.
2. Name it `tulpar` (any name works). Google Analytics is not needed; switch it off.

## 2. Register the web app and copy its config
1. On the project overview, click the **</>** (Web) icon.
2. Nickname: `tulpar-web`. Leave Firebase Hosting unticked (GitHub Pages hosts the site). Click **Register app**.
3. Firebase shows a block like `const firebaseConfig = { apiKey: "...", authDomain: "...", ... }`.
4. Open `app/firebase-config.js` and replace `window.TULPAR_FIREBASE = null;` with:
   ```js
   window.TULPAR_FIREBASE = {
     apiKey: "...",
     authDomain: "....firebaseapp.com",
     projectId: "...",
     storageBucket: "....appspot.com",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
   This config is safe to publish: it only identifies the project. The security rules in step 4 are what protect it.

## 3. Turn on Google sign-in
1. **Build → Authentication → Get started**.
2. **Sign-in method → Google → Enable**, choose a support email, **Save**.
3. **Settings → Authorized domains → Add domain**, and add:
   - `mjsbroadbent.github.io`
   - `tulparapp.com` and `www.tulparapp.com`

   (`localhost` is already there for testing.)

## 4. Create the database and paste the rules
1. **Build → Firestore Database → Create database**.
2. Pick a location close to your players (e.g. `europe-west`); it can't be changed later. Start in **production mode**.
3. Open the **Rules** tab, delete what's there, paste the whole of `firestore.rules` from this repo, and click **Publish**.

## 5. Make yourself an admin
1. Push the config, open the app (`https://<your site>/app/`), go to **Profile**, sign in with Google, pick a display name and join.
2. Profile shows **Your Tulpar ID**; copy it.
3. In the Firebase console: **Firestore Database → Data → Start collection**. Collection ID `admins`, Document ID = your Tulpar ID, add any field (e.g. `note` = `owner`), **Save**.
4. Reload the app. You can now post in the official Tulpar channel, delete any message, ban people, and see reports under Profile.

Add co-moderators the same way, with their Tulpar IDs.

## Updating the rules
Whenever `firestore.rules` changes in this repo, open **Firestore Database → Rules**, replace everything with the new file and click **Publish**. No indexes are needed.

## Limits and costs
- The free plan allows 50,000 reads and 20,000 writes a day. Each room loads its last 100 messages, so roughly 500 room openings a day before you'd need to think about it. If you ever hit the limit, chat just pauses until the next day; nothing is charged on Spark.
- Posting is limited to one message every 5 seconds per person in rooms and every 2 seconds in private chats, 500 characters each. Admins are exempt.
- Message alerts work only while Tulpar is open (in a tab or installed). True push notifications when the app is closed need a server (Cloud Functions, a paid plan), so they're not included.
- Under **Usage and billing** you can watch the numbers.

## Testing the rules (optional)
**Firestore → Rules → Rules Playground** lets you simulate a read or write as a signed-in user before going live, e.g. try creating `rooms/talas/messages/test` without a profile; it should be denied.

## Moderation, in short
- Anyone can tap a message to react, reply, report it or hide that person's messages.
- Private chats can only be read by their two members. Reported private messages show in the admin Reports list; admins can ban the sender but can't delete messages in someone else's private chat.
- Admins see reports in Profile, can delete messages and ban people (banned users can still read but not post).
- Rooms carry a pinned note reminding people they're public and not to share personal details.
