# Text Formatting Guide

This guide covers all special text formatting markers used in database content (Torah, Tefilla, Halacha, Marriage Insights, etc.). These markers are processed by the app and rendered as styled HTML.

---

## Basic Formatting

| Marker | What You Type | What It Does |
|--------|--------------|--------------|
| Bold | `**your text**` | Makes text **bold** |
| Title | `##your text##` | Big bold title text (1.5x size, bold, on its own line) |
| Line Break | `---` | Adds a blank line / spacing break |
| Grey Text | `~~your text~~` | Makes text grey and slightly faded |
| Larger Bold | `++your text++` | Makes text larger (1.2x size) and bold |
| Smaller Text | `--your text--` | Makes text smaller (0.85x size) |
| Grey Box | `[[your text]]` | Puts text in a grey highlighted box with left border |
| Grey Box (English) | `{{your text}}` | Same grey box, specifically for English content |
| Hyperlink | `[click here](https://example.com)` | Creates a clickable pink underlined link |
| Bullet Point | `* your text` or `- your text` | Creates a bullet point (must be at start of line) |

---

## Examples

### Bold
```
**Baruch Hashem** we are grateful
```
Result: **Baruch Hashem** we are grateful

### Title
```
##Birkat HaShachar##
```
Result: Large bold heading "Birkat HaShachar" on its own line

### Grey Text (Instructions)
```
~~Say the following three times:~~
```
Result: Faded grey instruction text

### Larger Bold (Opening Words)
```
++Modeh Ani++ Lefanecha...
```
Result: "Modeh Ani" appears larger and bold, rest is normal

### Smaller Text (Notes)
```
--See Shulchan Aruch for details--
```
Result: Smaller sized note text

### Grey Box
```
[[Insert name of the person here]]
```
Result: Text appears in a grey highlighted box

### Hyperlink
```
[Visit our website](https://www.example.com)
```
Result: "Visit our website" as a clickable pink underlined link

### Line Break
```
First paragraph---Second paragraph
```
Result: First paragraph, then spacing, then second paragraph

### Bullet Points
```
* First item
* Second item
- Third item
```
Result: Bulleted list with dot markers

---

## Footnote Formatting

Footnote numbers in text are automatically converted to small superscripts. For example, if the footnotes section contains "39. Rashi explains...", then any "39" appearing after punctuation in the main text will be displayed as a tiny superscript number.

No special markers needed - this happens automatically based on the footnotes content.

---

## Conditional Formatting (Tefilla/Prayers Only)

These tags show or hide content based on the Jewish calendar. Content between the tags only appears on the relevant days.

### Holiday Conditions
| Tag | When Content Shows |
|-----|-------------------|
| `[[CHANUKA]]...[[/CHANUKA]]` | During Chanuka |
| `[[PURIM]]...[[/PURIM]]` | On Purim |
| `[[PESACH]]...[[/PESACH]]` | During Pesach |
| `[[SUKKOT]]...[[/SUKKOT]]` | During Sukkot |
| `[[ROSH_CHODESH]]...[[/ROSH_CHODESH]]` | On Rosh Chodesh |
| `[[FAST_DAY]]...[[/FAST_DAY]]` | On fast days |
| `[[ASERET_YEMEI_TESHUVA]]...[[/ASERET_YEMEI_TESHUVA]]` | During the Ten Days of Repentance |

### Location Conditions
| Tag | When Content Shows |
|-----|-------------------|
| `[[ONLY_ISRAEL]]...[[/ONLY_ISRAEL]]` | Only for users in Israel |
| `[[OUTSIDE_ISRAEL]]...[[/OUTSIDE_ISRAEL]]` | Only for users outside Israel |

### Special Remove
| Tag | What It Does |
|-----|-------------|
| `[[SPECIAL_REMOVE]]...[[/SPECIAL_REMOVE]]` | HIDES content during ANY special day (Rosh Chodesh, Pesach, Sukkot, Chanuka, or Purim) |

### Day-Specific Conditions
| Tag | When Content Shows |
|-----|-------------------|
| `[[MONDAY]]...[[/MONDAY]]` | Only on Monday |
| `[[TUESDAY]]...[[/TUESDAY]]` | Only on Tuesday |
| `[[WEDNESDAY]]...[[/WEDNESDAY]]` | Only on Wednesday |
| `[[THURSDAY]]...[[/THURSDAY]]` | Only on Thursday |
| `[[FRIDAY]]...[[/FRIDAY]]` | Only on Friday |
| `[[SATURDAY]]...[[/SATURDAY]]` | Only on Saturday |
| `[[SUNDAY]]...[[/SUNDAY]]` | Only on Sunday |

### Food Selection Conditions (Brochas)
| Tag | When Content Shows |
|-----|-------------------|
| `[[grain]]...[[/grain]]` | When grain is selected |
| `[[wine]]...[[/wine]]` | When wine is selected |
| `[[fruit]]...[[/fruit]]` | When fruit is selected |
| `[[grain,wine]]...[[/grain,wine]]` | When both grain and wine selected |
| `[[grain,fruit]]...[[/grain,fruit]]` | When both grain and fruit selected |
| `[[wine,fruit]]...[[/wine,fruit]]` | When both wine and fruit selected |
| `[[grain,wine,fruit]]...[[/grain,wine,fruit]]` | When all three selected |

---

## Combining Formatters

You can combine formatting markers. For example:

```
##Birkat HaShachar##

++Modeh Ani++ Lefanecha Melech Chai V'kayam...

~~Say the following while washing hands:~~

**Baruch** Atah Hashem...

---

[[Insert your personal prayer here]]

--Based on Shulchan Aruch Orach Chaim 1:1--
```

---

## Important Notes

1. All formatting works identically for both English and Hebrew text
2. Formatting markers must have matching opening and closing pairs
3. The `---` line break marker should not be confused with `--text--` (smaller text)
4. Grey boxes `[[ ]]` with conditional keywords (like CHANUKA, MONDAY, etc.) are treated as conditional content, not visual grey boxes
5. Links open in a new tab and are styled in pink (#E91E63) with underline
