# Permission matrisi

| Alan | OWNER | BRANCH_MANAGER | MENU_EDITOR | WAITER | KITCHEN_STAFF | VIEWER |
|---|---|---|---|---|---|---|
| tenant/manage | ✓ | — | — | — | — | — |
| catalog/write | ✓ | koşullu | ✓ | — | — | — |
| price/write | ✓ | koşullu | koşullu | — | — | — |
| order/accept-reject | ✓ | ✓ | — | ✓ | — | — |
| order/prepare-ready | ✓ | ✓ | — | — | ✓ | — |
| order/deliver | ✓ | ✓ | — | ✓ | — | — |
| membership/manage | ✓ | şube | — | — | — | — |
| subscription/manage | ✓ | — | — | — | — | — |
| read | ✓ | kapsamlı | kapsamlı | kapsamlı | kapsamlı | kapsamlı |

Endpointler rol adına değil permission'a bakar; rol varsayılan permission
demetidir. Branch scope ve tenant object authorization ayrıca uygulanır.

