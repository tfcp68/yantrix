---
title: React
---
# React Examples
## [Traffic light](02-traffic-light-react/index.html){target="_blank"}

Source code: [02-traffic-light-react](https://github.com/tfcp68/yantrix/tree/main/examples/02-traffic-light-react)

### Diagram

```mermaid
stateDiagram-v2
	[*] --> Off: Reset (initialCounter=0)
	Off --> Red: Switch
	Red --> RedYellow: Switch
	RedYellow --> Green: Switch
	Green --> Yellow: Switch
	Yellow --> Red: Switch
	note left of Off
		+Init
	end note
note right of [*]
#{ counter = 0 } <= coalesce($initialCounter, inc(#counter))
end note
```
