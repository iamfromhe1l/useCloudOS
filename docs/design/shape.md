# Shape

| Role               | Radius                        | Use                                               |
| ------------------ | ----------------------------- | ------------------------------------------------- |
| xs                 | 6px                           | Small technical/control details                   |
| small              | 10px                          | Menu items, efficient file/service rows           |
| medium             | 16px                          | Buttons, inputs, icon tiles, menus                |
| large              | 24px                          | Tonal groups, metric surfaces                     |
| extra-large/window | 28px                          | Application windows and major surfaces            |
| expressive         | 32px / asymmetric 12px corner | Desktop identity only                             |
| full               | 999px                         | Chips, segmented selectors, compact shell modules |

Tokens live in @usecloud/theme/styles/tokens.css. Full radius is not the default
for every action. Compact windows lose outer floating radius, not interior shape.
