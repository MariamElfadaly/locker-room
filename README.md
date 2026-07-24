# Locker Room

A locker assignment tool with a login screen (Firebase Auth) and cloud storage
(Firestore). Everyone who logs in shares the same locker room data -- built as
simple internal software for a team managing one physical room.

## Quick setup (no command line needed after this)

### 1. Create the Firebase project
1. https://console.firebase.google.com -> Add project -> follow the steps.
2. Click the Web icon (</>) to register a web app -> give it any name -> Register.
3. Firebase shows a `firebaseConfig` block. Keep this tab open, you'll need it next.

### 2. Turn on login and the database
- Authentication -> Get started -> Sign-in method tab -> enable **Email/Password**.
- Firestore Database -> Create database -> **production mode** -> pick a region -> Enable.
- Firestore -> Rules tab -> open `firestore.rules` from this folder, copy all of it,
  paste it over what's in the console, click Publish.
- Authentication -> Users tab -> Add user -> this is your login (add teammates the same way).

### 3. Paste your config into the code
Open `src/firebase.js` in this folder with any text editor. Replace the six
`"PASTE_..._HERE"` placeholders with the matching values from your firebaseConfig
in step 1. Save the file.

That's the only file you need to edit.

### 4. Upload to GitHub (drag and drop, no terminal)
1. On your computer, make sure hidden files are visible so the `.github` folder
   comes along: Mac -> Finder -> Cmd+Shift+. -- Windows -> File Explorer -> View -> Show -> Hidden items.
2. https://github.com/new -> name the repo exactly `locker-room` (this matters --
   see `vite.config.js` if you want a different name) -> Create repository (leave it empty).
3. On the new repo's page, click **uploading an existing file**.
4. Open this project folder and drag *everything inside it* (not the folder itself)
   into the browser window -- including `.github`, `.gitignore`, all of `src/`, etc.
   Skip `node_modules` and `dist` if you happen to have them (not needed).
5. Scroll down, click **Commit changes**.

### 5. Turn on Pages
Repo -> Settings -> Pages -> under "Source" choose **GitHub Actions**.

That's it -- no secrets to add, since your config is already in the code. Check the
**Actions** tab on your repo; it'll build and deploy automatically (~1 minute).
Your site will be live at `https://<your-username>.github.io/locker-room/`.

### 6. Tell Firebase about your new domain
Firebase Console -> Authentication -> Settings -> Authorized domains -> Add domain
-> enter `<your-username>.github.io`. Without this, login will fail on the live site.

Done. Visit the URL, log in with the account from step 2, and start using it.

## Later: custom domain
1. Repo -> Settings -> Pages -> add your custom domain, point your DNS at GitHub per their instructions.
2. Add that new domain to Firebase's Authorized domains too (step 6 above).
3. Change `base: '/locker-room/'` to `base: '/'` in `vite.config.js`, re-upload that one file.

## Data model
All data lives in one Firestore document: `shared/lockerRoom`. Any signed-in user
reads/writes it -- there's no per-user isolation, since everyone logging in is
trusted staff managing the same physical lockers.

## Security
- `firestore.rules` (already included) denies everything by default; only signed-in
  users can read/write `shared/lockerRoom`, and writes are schema/size-validated.
- No public sign-up -- accounts only exist if you create them in step 2, so a
  stranger finding your URL can't register and get in.
- The Firebase config in `src/firebase.js` is not a secret (every client-side
  Firebase app ships this publicly) -- your real protection is the rules above.
- Employee names/details are HTML-escaped in the PDF export (blocks stored XSS),
  and CSV export neutralizes leading `=+-@` characters (blocks spreadsheet formula
  injection). Employee fields are capped at 80 characters.
- Optional next step once real people depend on this: Firebase App Check, which
  blocks traffic that isn't coming from your real app. Ask if you want this added.

## If you'd rather use the command line
```
npm install
npm run dev        # test locally
```
Everything else (build, deploy) happens automatically via GitHub Actions on push --
see `.github/workflows/deploy.yml`.
