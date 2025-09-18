# Tefilla Conditional Content System

This system allows you to create dynamic Tefilla content in Supabase that displays different text based on:
- User location (Outside Israel only)
- Hebrew calendar events (Rosh Chodesh and Fast Days)

**Important**: Default content always shows unless specifically tagged with conditional markers.

## Code Words for Supabase Content

You can use these code words in your Tefilla text within double square brackets:

### Location-Based
- `[[OUTSIDE_ISRAEL]]content[[/OUTSIDE_ISRAEL]]` - Shows only for users outside Israel

### Hebrew Calendar-Based
- `[[ROSH_CHODESH]]content[[/ROSH_CHODESH]]` - Shows only on Rosh Chodesh days
- `[[FAST_DAY]]content[[/FAST_DAY]]` - Shows only on fast days
- `[[ASERET_YEMEI_TESHUVA]]content[[/ASERET_YEMEI_TESHUVA]]` - Shows only during the days between Rosh Hashana and Yom Kippur
- `[[SUKKOT]]content[[/SUKKOT]]` - Shows only during Sukkot
- `[[PESACH]]content[[/PESACH]]` - Shows only during Pesach
- `[[ROSH_CHODESH_SPECIAL]]content[[/ROSH_CHODESH_SPECIAL]]` - HIDES content during Rosh Chodesh, Pesach, Sukkot, or Aseret Yemei Teshuva (exclusion tag)

### Combining Conditions
You can combine multiple conditions using commas (AND logic):
- `[[OUTSIDE_ISRAEL,ROSH_CHODESH]]content[[/OUTSIDE_ISRAEL,ROSH_CHODESH]]` - Shows only for users outside Israel on Rosh Chodesh
- `[[OUTSIDE_ISRAEL,FAST_DAY]]content[[/OUTSIDE_ISRAEL,FAST_DAY]]` - Shows only for users outside Israel on fast days
- `[[ROSH_CHODESH,PESACH]]content[[/ROSH_CHODESH,PESACH]]` - Shows only during Rosh Chodesh that occurs during Pesach
- `[[OUTSIDE_ISRAEL,ASERET_YEMEI_TESHUVA]]content[[/OUTSIDE_ISRAEL,ASERET_YEMEI_TESHUVA]]` - Shows only for users outside Israel during the Ten Days of Repentance
- `[[ROSH_CHODESH_SPECIAL]]content[[/ROSH_CHODESH_SPECIAL]]` - Shows content EXCEPT during Rosh Chodesh, Pesach, Sukkot, or Aseret Yemei Teshuva

## Example Usage in Supabase

### Basic Example
```
Regular prayer text that everyone sees.

[[OUTSIDE_ISRAEL]]
אלוהינו ואלוהי אבותינו, ברכנו בברכה המשולשת בתורה הכתובה על ידי משה עבדך, האמורה מפי אהרן ובניו כהנים עם קדושך, כאמור:

יברכך יי וישמרך.
יאר יי פניו אליך ויחנך.
ישא יי פניו אליך וישם לך שלום.
[[/OUTSIDE_ISRAEL]]

More regular prayer text.

[[ROSH_CHODESH]]
יהי רצון מלפניך יי אלוהינו ואלוהי אבותינו, שתחדש עלינו את החודש הזה לטובה ולברכה.
[[/ROSH_CHODESH]]
```

### Complex Example with Multiple Conditions
```
Morning blessings for everyone:

ברוך אתה יי אלוהינו מלך העולם אשר נתן לשכוי בינה להבחין בין יום ובין לילה.

[[OUTSIDE_ISRAEL,WEEKDAY]]
Special addition for weekdays outside Israel:
ברוך אתה יי אלוהינו מלך העולם שלא עשני גוי.
[[/OUTSIDE_ISRAEL,WEEKDAY]]

[[FAST_DAY]]
On fast days, we add:
רפאנו יי ונרפא, הושיענו ונושעה, כי תהלתנו אתה.
[[/FAST_DAY]]

[[SHABBAT]]
Special Shabbat addition:
שמחנו יי אלוהינו במשה עבדך ובישראל עמך ובירושלים עירך ובציון משכן כבודך.
[[/SHABBAT]]
```

## Technical Implementation

The system automatically:
1. Detects user location using geolocation and reverse geocoding
2. Fetches Hebrew calendar data from Hebcal API
3. Processes conditional sections in real-time
4. Displays only relevant content based on current conditions

## How to Add to Existing Prayers

1. Edit your prayer content in Supabase
2. Add conditional sections using the code words above
3. The system automatically processes the content when displayed
4. Users will see only the relevant sections based on their location and the current Hebrew date

## Supported Fast Days

The system automatically detects these fast days:
- Fast of Gedaliah (צום גדליה)
- Fast of Tevet (עשרה בטבת)
- Fast of Esther (תענית אסתר)
- Tisha B'Av (תשעה באב)

## Supported Holidays

The system detects major Jewish holidays:
- Rosh Hashana
- Yom Kippur
- Sukkot
- Pesach
- Shavuot
- Purim
- Chanukah

## Testing

You can test different conditions by:
1. Changing your location
2. Testing on different Hebrew calendar dates
3. Using the debug function in developer tools