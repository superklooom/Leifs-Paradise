# חיבור טופס "Add dahlia" לגוגל שיט

הסקריפט `Code.gs` מאפשר לאתר להוסיף שורות לגיליון. ההתקנה נעשית פעם אחת, וזה לוקח בערך 5 דקות.

## 1. הדבקת הסקריפט
1. פותחים את הגיליון של הדליות ב-Google Sheets.
2. בתפריט: **Extensions → Apps Script**.
3. מוחקים את כל מה שכתוב בקובץ `Code.gs` שנפתח, ומדביקים במקומו את כל התוכן של הקובץ `apps-script/Code.gs` מה-repo.
4. לוחצים על אייקון השמירה (💾).

## 2. בחירת קוד סודי (PIN)
1. בתפריט הצד השמאלי של Apps Script: **⚙️ Project Settings**.
2. גוללים למטה עד **Script Properties**, ואז **Add script property**.
3. בשדה Property כותבים `PIN`. בשדה Value כותבים את הקוד שתבחרו, למשל `4821`.
4. **Save script properties**.

את הקוד הזה תקלידו באתר בפעם הראשונה שתוסיפו דליה. אחרי זה הדפדפן יזכור אותו.

## 3. פרסום כ-Web App
1. למעלה מימין: **Deploy → New deployment**.
2. ליד "Select type" לוחצים על ⚙️ ובוחרים **Web app**.
3. ממלאים:
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`
4. לוחצים **Deploy**. גוגל תבקש אישור הרשאות:
   **Authorize access**, בוחרים את החשבון, ואז **Advanced → Go to … (unsafe) → Allow**.
   (האזהרה מופיעה כי זה סקריפט פרטי שלכם ולא אפליקציה שעברה אישור של גוגל. זה תקין.)
5. מעתיקים את ה-**Web app URL**. הוא נראה כך: `https://script.google.com/macros/s/AKfy…/exec`

## 4. חיבור לאתר
שולחים את הכתובת לClaude, או מגדירים אותה בעצמכם באחת משתי הדרכים:
- **ב-Netlify:** Site configuration → Environment variables → משתנה בשם `VITE_SHEET_WRITE_URL` עם הכתובת כערך, ואז Deploy מחדש.
- **או בקוד:** כותבים את הכתובת ב-`src/config.js`.

אחרי זה יופיע באתר כפתור ירוק **+ Add dahlia**.

## עדכון הסקריפט בעתיד
אם משנים את `Code.gs`: **Deploy → Manage deployments → ✏️ → Version: New version → Deploy**.
כך הכתובת נשארת אותה כתובת.

## אבטחה
- כל בקשה בלי ה-PIN הנכון נדחית.
- כדי להחליף PIN, משנים את הערך ב-Script Properties. אין צורך לפרסם מחדש.
- בכל בקשה אפשר להוסיף עד 50 פקעות.
