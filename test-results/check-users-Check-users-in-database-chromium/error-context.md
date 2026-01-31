# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - img "Entretien Prestige" [ref=e5]
      - heading "Entretien Prestige" [level=2] [ref=e6]
      - paragraph [ref=e7]: Faites briller votre maison
    - heading "Sign in" [level=1] [ref=e8]
    - paragraph [ref=e9]: Enter your credentials to access your account.
    - generic [ref=e10]:
      - generic [ref=e11]:
        - generic [ref=e12]: Email
        - textbox "Email" [ref=e13]: jelidiadam12@gmail.com
      - generic [ref=e14]:
        - generic [ref=e15]: Password
        - textbox "Password" [ref=e16]: Prestige2026!
        - generic [ref=e17]: Minimum 8 caractères, 1 majuscule, 1 chiffre, 1 caractère spécial.
      - generic [ref=e18]:
        - checkbox "Se souvenir de ce numéro" [checked] [ref=e19] [cursor=pointer]
        - generic [ref=e20] [cursor=pointer]: Se souvenir de ce numéro
      - button "Signing in..." [disabled] [ref=e21] [cursor=pointer]
    - link "Forgot password?" [ref=e23] [cursor=pointer]:
      - /url: /forgot-password
  - alert [ref=e24]
```