## Chapter 9: Complete XPath Reference

### 9.1 XPath Axes Complete List
| Axis | Description | Example |
| --- | --- | --- |
| ancestor | All ancestors (parent, grandparent, etc.) | `//input/ancestor::form` |
| ancestor-or-self | Current node and all ancestors | `//input/ancestor-or-self::div` |
| attribute (@) | Attributes of current node | `//div/@class` |
| child (/) | Direct children only | `//div/child::span` |
| descendant (//) | All descendants | `//form/descendant::input` |
| descendant-or-self | Current node and all descendants | `//form/descendant-or-self::*` |
| following | All nodes after current node | `//h3/following::p` |
| following-sibling | Siblings after current node | `//label/following-sibling::input` |
| parent (..) | Direct parent only | `//input/parent::div` |
| preceding | All nodes before current node | `//footer/preceding::div` |
| preceding-sibling | Siblings before current node | `//input/preceding-sibling::label` |
| self (.) | Current node itself | `//input/self::input` |

### 9.2 XPath Operators
| Operator | Description | Example |
| --- | --- | --- |
| \| | Union (combines results) | `//input \| //button` |
| + | Addition | `//div[position() + 1]` |
| - | Subtraction | `//div[last() - 1]` |
| * | Multiplication | `//div[position() * 2]` |
| div | Division | `//div[position() div 2]` |
| = | Equals | `//input[@type='text']` |
| != | Not equals | `//input[@type!='hidden']` |
| < | Less than | `//div[number(.) < 100]` |
| <= | Less than or equal | `//div[number(.) <= 100]` |
| > | Greater than | `//div[number(.) > 100]` |
| >= | Greater than or equal | `//div[number(.) >= 100]` |
| and | Logical AND | `//input[@type='text' and @name='user']` |
| or | Logical OR | `//input[@type='text' or @type='email']` |
| mod | Modulus | `//div[position() mod 2 = 0]` |

### 9.3 Common XPath Patterns Quick Reference
| Pattern | XPath | Description |
| --- | --- | --- |
| By ID | `//*[@id='elementId']` | Select element by ID |
| By Class | `//*[@class='className']` | Select by exact class |
| Contains Class | `//*[contains(@class,'partial')]` | Select by partial class |
| By Text | `//tag[text()='exact text']` | Exact text match |
| Contains Text | `//tag[contains(text(),'partial')]` | Partial text match |
| By Attribute | `//tag[@attribute='value']` | Any attribute |
| Multiple Attributes | `//tag[@attr1='val1' and @attr2='val2']` | Multiple conditions |
| OR Condition | `//tag[@attr1='val1' or @attr2='val2']` | Either condition |
| Parent Element | `//child/parent::tag` | Navigate to parent |
| Child Element | `//parent/child::tag` | Navigate to child |
| Following Sibling | `//element/following-sibling::tag` | Next siblings |
| Preceding Sibling | `//element/preceding-sibling::tag` | Previous siblings |
| Nth Element | `(//tag)[n]` | Specific position |
| Last Element | `(//tag)[last()]` | Last element |
| First Element | `(//tag)[1]` | First element |
| Not Condition | `//tag[not(@disabled)]` | Exclude condition |
| Visible Only | `//tag[not(ancestor-or-self::*[contains(@style,'display: none')])]` | Only visible elements |
| Starts With | `//tag[starts-with(@id,'prefix')]` | Attribute starts with |
| Dynamic ID | `//tag[contains(@id,'partial')]` | Partial attribute match |

---
