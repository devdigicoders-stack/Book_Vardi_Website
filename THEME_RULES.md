# Book Vardi Design System, Theme Rules & Tailwind CSS Standard

> **MANDATORY PROJECT RULE**: All developers and AI agents working on this codebase must strictly adhere to the standards outlined in this document.

---

## 1. Core Principles

1. **JSX & Tailwind CSS Architecture**:
   - The project uses **React (JSX)** and **Tailwind CSS v4** coupled with design token CSS custom properties.
   - All styling should be implemented using Tailwind CSS utility classes configured with the brand palette, or direct `var(--token-name)` CSS variables.

2. **Zero Arbitrary Hardcoded Colors**: 
   - Never use random arbitrary hex classes like `bg-[#233835]` or inline `style={{ color: '#f5ce42' }}`.
   - Always use the semantic brand utilities: `bg-brand-teal`, `text-brand-yellow`, `bg-brand-pink`, `text-brand-ochre`, `bg-brand-blue`, or CSS variables via `var(--token-name)`.

3. **Consistent Spacing & Radii**:
   - Use standard Tailwind spacing scale (`p-2`, `p-4`, `p-6`, `gap-3`, `gap-6`, etc.) and radii (`rounded-lg`, `rounded-xl`, `rounded-full`).

4. **Typography**:
   - Headings & Titles: `font-display` (`Outfit`, `Plus Jakarta Sans`).
   - Body & UI text: `font-sans` (`Plus Jakarta Sans`, `Inter`).

---

## 2. Color Tokens & Tailwind Class Mappings

| Token Name | Hex Value | Tailwind Utility Classes | Purpose / Usage |
| :--- | :--- | :--- | :--- |
| `--color-brand-teal` | `#233835` | `bg-brand-teal`, `text-brand-teal`, `border-brand-teal` | **Deep Forest Teal**. Dark surfaces, navbar/footer, main headings, high-contrast buttons. |
| `--color-brand-teal-light`| `#2F4845` | `bg-brand-teal-light`, `hover:bg-brand-teal-light` | Elevated card surfaces, hover state on teal buttons. |
| `--color-brand-teal-dark` | `#172725` | `bg-brand-teal-dark`, `text-brand-teal-dark` | Deepest contrast surfaces, toast backgrounds. |
| `--color-brand-yellow` | `#F5CE42` | `bg-brand-yellow`, `text-brand-yellow`, `ring-brand-yellow` | **Primary Action Yellow** ('SC' logo). Primary CTAs, Cart button, badges, active tabs. |
| `--color-brand-yellow-hover`| `#E5BD2E` | `hover:bg-brand-yellow-hover` | Hover states for primary yellow CTAs. |
| `--color-brand-pink` | `#C45A76` | `bg-brand-pink`, `text-brand-pink`, `border-brand-pink` | **Berry Mauve** ('HOOL' logo). Sale badges, discount highlights ("Up to 25% Off"), active wishlist. |
| `--color-brand-pink-hover`| `#B24D67` | `hover:bg-brand-pink-hover` | Hover states for pink buttons. |
| `--color-brand-ochre` | `#B99452` | `bg-brand-ochre`, `text-brand-ochre` | **Warm Ochre / Tan** ('ART' logo). Review rating stars, artisan category highlights. |
| `--color-brand-blue` | `#5B86E5` | `bg-brand-blue`, `text-brand-blue` | **Stationery Blue**. Trust badges, pen accents, informational alerts. |

---

## 3. How to Use in JSX Components

### Recommended (Tailwind Utility Classes with Theme Tokens):
```jsx
// ✅ Correct: Uses Tailwind with brand theme tokens
<button className="inline-flex items-center gap-2 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-bold px-6 py-3 rounded-lg shadow-sm transition-all text-sm">
  <ShoppingBag size={18} />
  <span>SHOP NOW</span>
</button>
```

### Prohibited (FORBIDDEN):
```jsx
// ❌ FORBIDDEN: Hardcoded arbitrary hex values
<button className="bg-[#f5ce42] text-[#233835] p-[11px] rounded-[7px]">
  Shop Now
</button>
```

---

## 4. Component Checklist for New Features
- [ ] Built with standard React JSX (`.jsx`).
- [ ] Styled with Tailwind CSS classes using semantic `brand-*` palette tokens.
- [ ] Fonts use `font-display` for headings and `font-sans` for UI text.
- [ ] Responsive grid and flexbox layouts with breakpoints (`sm:`, `md:`, `lg:`).
- [ ] Interactive states (`hover:`, `focus:`, `active:`) and smooth transitions (`transition-all`, `duration-300`).
