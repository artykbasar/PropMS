# PropMS Website V2 component mapping

M3 establishes the controlled component API. Legacy Day templates remain available and are not modified by this milestone.

| Legacy Day template | V2 target | M3 status |
| --- | --- | --- |
| Hero Day | PropMS V2 Hero | Implemented |
| About Day | PropMS V2 Media Content Split | Implemented |
| Services Day | PropMS V2 Service Grid | Implemented |
| Why Us Day | PropMS V2 Feature Grid | Implemented |
| Areas Day | PropMS V2 Area Grid | Implemented |
| CTA Day | PropMS V2 CTA | Implemented |
| Contact Day | PropMS V2 Contact Location | Implemented |
| Day Standard | V2 shell footer | Existing shell responsibility |

Approved catalogue items not implemented in M3 remain reserved for later milestones: Rich Content, Statistics, Trust / Accreditation Strip, Testimonial / Quote, Logo / Platform Strip, Gallery, and Questions / Answers. Contact / Enquiry and Location / Map share the initial `PropMS V2 Contact Location` foundation until their later behaviour is specified.

All M3 components use typed Web Template fields. `theme` is restricted to `default`, `primary`, `secondary`, `soft`, `dark`, or `inverse`; component-specific `variant` fields are small Select enums. No component accepts arbitrary CSS or JavaScript.
