# CRM


- [x] DASHBOARDS - whenever you have time test with 2500, 5000 data objects to see if we need to paginate server side
- [ ] ping users cell phones when email or text comes through in the crm ensures they get notified even when they are away from desk
- [ ] free for single users? with paid upgrades? ie email sms phone calls
- [ ] when making free for all users, have a way for sales managers to join and see their teams stats, when sales people sign up they will have to assign themselves a dealer
- [ ] payment processor for purchases?
- [ ] cross platform ad manager, post it once here and push it to different providors


- [ ] -------- BACK BURNER --------
- [ ] whenever you try to switch to remix 2.0 build the microsoft login like you did over in the mobile web apps, custom build
- [ ] bdc center
- [ ] auto print signs for bikes from dealer inventory page
- [ ] implement server to accommodate automation https://github.com/Saicharan0662/email-scheduler-client
- [ ] ADMIN DASH - have it populate api keys so managers can hand them out
- [ ] ADMIN DASH - email / sms campaigns https://developers.klaviyo.com/en/reference/get_campaigns
- [ ] admin / import / csv wizard has the working code for dropping files onto inputs to upload them isntead of using the file explorer, we need to get this every else in the app
- [ ] client portal can make payments via online transfer and once we get payment processsing then take cards of the site as well
- [ ] create bdc
- [ ] in user getting started maybe have a video for first time walkthrough 
- [ ] for receiving have option to print single tags?
- [ ] If you have enough money in your account right to get the versatile corporate account tonight that way we can start testing and modifying everything for that
- [ ] sales / customer / clientid / finance id -- useEffect with dependant emailData -- search text for -- useEffectEmaiLData
- [ ] redesign your own turbo repo and leave this garbage project in the past
- [ ]  need to fix "files.autoSave": "afterDelay", "editor.cursorSurroundingLines": 0 in seetings.json so the file does not unfold at each save with cursor being push to bottom of file
- [ ]  add a save mechanism while you type to the text editor
- [ ] sales / customer / clientid / finance id -- potential for useefect to be here -- search previous description to find areas quickly


- [ ] -------- AUTOMATION --------
- [ ] best system so far: offer options of what to do, the base need that they can turn off and on and write their own message, user does not have to setup their own automations this way or call head office to get them to do it
- [ ] customer set times of most common communications - MAYBE
- [ ] auto email at 5 2.5 months and 30 7 days before consent expires, 2 years if bought, 6 months if not
- [ ] customer 2 months after pick up to make sure everything is still good
- [ ] auto create events for sales staff to follow up with sales


- [ ] -------- CLIENT SITE --------
- [ ] enable customers to book rentals online by themselves


- [ ] -------- SALES --------
- [ ] sales bot - take care of some of the sales process - uses natural language processing and machine learning to assist in automated contract negotiations based on predefined parameters.
- [ ] sales bot 2 - customer onboarding
- [ ] sales bot 3 - after sales
- [ ] for sales data chart have three sections top - list 3 things to most improve on so the sales person doesnt have too look at or decipher the sales data, second graphic charts like on shadcn, then third and finnally breaking down into more nerdy numbers to see exactly what you need to do to improve every aspect
- Ai assistant to give hints on what to do next like a reminder
- [x] Ai assistant to book apointments complete and etc like gowrench or just a work flow o ustomers to guide themselves


- [ ] -------- SERVICE --------
- [ ] service dash - tab where it shows customers who havent had a service in 6 months
- [ ] SERVICE - scan incoming crates and add them into inventory or something, maybe a inbox for the admin to convert them to inventory


- [ ] -------- PAID FEATURE --------
- [x] PAID FEATURE - peech to text for quicker input - done in components folder
- [ ] PAID FEATURE - vercel has a nice write up on this to do in their platform - ai - wip - https://github.com/steven-tey/chathn/blob/main/app/api/chat/route.ts

- [ ] -------- IMPROVE USER EXP --------
- [x] https://www.youtube.com/watch?v=-0Qi0yMyLwQ optimistic add for modifying forms for when you get used to the layour
https://www.youtube.com/watch?v=-0Qi0yMyLwQ optimistic add for modifying forms for cache user and client info and othe rinfo used alot
https://www.youtube.com/watch?v=-0Qi0yMyLwQ optimistic add for modifying forms for tried to cache pages in entry.client... became too big after a while should only cache most used pages it also produced some weird side effects
https://www.youtube.com/watch?v=-0Qi0yMyLwQ optimistic add for modifying forms for optomized component reduce the frequency of re-renders like useMemo, memo, and useCallack
- [x] IMPROVE USER EXP - Service Workers and Background Sync: Service workers can help cache static assets and enable background synchronization which will allow users to continue interacting with the app when offline or on a slow connection. You can also use service workers to handle background prefetching
- [x] IMPROVE USER EXP - admin dashboard - when going over clients and other objects ie for clients open dialog on left have nave men`u with a first level of items such as finance work order acc order and the when you click on it you can then click on the tabs for each layer on that data segment
- [ ] IMPROVE USER EXP - Reducing Initial Data Payload: Audit the data fetched by each page or component and ensure that only necessary information is sent. For complex queries consider breaking down requests or loading partial data on initial load then fetching more details after the user has started interacting
- [ ] IMPROVE USER EXP - Optimizing Network Requests: Minimize the number of network requests made by bundling data together where possible using HTTP/2 to reduce connection overhead and compressing data responses with GZIP or Brotli
- [x] IMPROVE USER EXP - Client-Side State Management: If your app has frequent server interactions for small bits of data consider using a global state management solution like Zustand or Redux to store data in memory where possible to reduce server calls

- [ ] -------- END GAME --------
- [ ] have blue book values on quote section
- [ ] BLUE BOOK - contacted... no answer reach out again
- [ ] END GAME - have a second non-cloud option either as a rack for a server or tower for a non tech orientated dealer to be hosted on site but would need a license key that needs a new token every 30 days/6 months/12 months to operate based on payment plan hardware to be paid upfront before build payments start once activated at dealer
- [ ] END GAME - have ai take in last 5 emails with customer and suggest your next communication/script - not done yet but easy enough to complete in components folder
- [ ] END GAME - Predictive Customer Behavior Modeling, Utilize advanced machine learning models to predict future customer behaviors and preferences based on historical data. ie percentages on how liuekly the customer can be closed if asked at that time
- [ ] END GAME - customter analysis retention customer $ worth visits and more
- [ ] to login as any dealer user, have seperate dealer site where its closed off to everyone but dev and have the authentication login as user with their dealers db
- [ ] need to subscription portal
- [ ] CHECK SUBSCRIPTION move to dev and the last day of the month run the script through automation, or set up an api to get the alerts
- [ ] in loader put const partnerSite = dealer.partnerSite to gain access to calendar site
- [ ] DEV / CONTROLPANEL when saving dealer details save projectName
- [ ] move roles to dev so you can control the dealers roles from there
- [ ] need dashboard to connect to all the dealers dashboards
- [ ] dashboard - to manage phone numbers for users
- [ ] dashboard - to monitor / and charge correct amounts for text / voice / email
- [ ] dashboard - manager potential customer base
- [ ] dashboard - manage authentication for emergencies for dealers
- [ ] best system so far: offer options of what to do, the base need that they can turn off and on and write their own message, user does not have to setup their own automations this way or call head office to get them to do it
- [ ] customer set times of most common communications - MAYBE
- [ ] auto email at 5 2.5 months and 30 7 days before consent expires, 2 years if bought, 6 months if not
- [ ] customer 2 months after pick up to make sure everything is still good
- [ ] auto create events for sales staff to follow up with sales
