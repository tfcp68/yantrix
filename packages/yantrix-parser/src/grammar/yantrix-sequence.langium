grammar YantrixSequence

import './yantrix-common';

// Sequence notes live inside mermaid sequence diagrams, where '#' and ';'
// terminate note text at the mermaid level. The packet data space therefore
// uses the '@' sigil instead of '#': same statement shapes as the state
// grammar, with '@{...}'/'@key' referring to the data packet on the arrow.

entry SequenceNoteDocument:
    (statements+=SequenceNoteStatement)*;

SequenceNoteStatement:
    SequencePacketStatement | SequenceEmitStatement | SequenceSubscribeStatement |
    DefineStatement | InjectStatement;

SequencePacketStatement:
    '@' '{' items+=RawKeyItem (',' items+=RawKeyItem)* '}'
    ('<=' reducer+=KeyItem (',' reducer+=KeyItem)*)?;

SequenceEmitStatement:
    'emit/' identifier=ID
    ('(' meta+=KeyItem (',' meta+=KeyItem)* ')')?
    ('<=' '@' '{' packet+=RawKeyItem (',' packet+=RawKeyItem)* '}')?;

SequenceSubscribeStatement:
    'subscribe/' identifier=ID (actionName=ID)?
    ('(' payload+=KeyItem (',' payload+=KeyItem)* ')')?
    ('<=' '(' metaItems+=KeyItem (',' metaItems+=KeyItem)* ')')?;
