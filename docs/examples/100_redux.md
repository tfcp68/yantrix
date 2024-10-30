---
title: Redux
---
# Redux Examples

## [Traffic light](01-traffic-light/index.html){target="_blank"}

Source code: [01-traffic-light](https://github.com/tfcp68/yantrix/tree/main/examples/01-traffic-light)

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
