import json
from pathlib import Path
from openai import OpenAI

ROOT = Path('/home/ubuntu/chung-sing-ai-writing')
SAMPLE_DIR = ROOT / 'test-samples'
OUT = ROOT / 'test-samples' / 'p6-evaluation-results.json'

schema = {
    'type': 'object',
    'properties': {
        'overall': {'type': 'integer', 'minimum': 0, 'maximum': 100},
        'scores': {
            'type': 'object',
            'properties': {
                'ideasVoice': {'type': 'integer', 'minimum': 0, 'maximum': 20},
                'structure': {'type': 'integer', 'minimum': 0, 'maximum': 20},
                'language': {'type': 'integer', 'minimum': 0, 'maximum': 20},
                'revision': {'type': 'integer', 'minimum': 0, 'maximum': 20},
            },
            'required': ['ideasVoice', 'structure', 'language', 'revision'],
            'additionalProperties': False,
        },
        'strengths': {'type': 'array', 'items': {'type': 'string'}, 'minItems': 2, 'maxItems': 3},
        'nextSteps': {'type': 'array', 'items': {'type': 'string'}, 'minItems': 2, 'maxItems': 3},
        'issues': {
            'type': 'array',
            'items': {
                'type': 'object',
                'properties': {
                    'category': {'type': 'string', 'enum': ['grammar', 'word_choice', 'punctuation', 'structure', 'clarity']},
                    'fragment': {'type': 'string'},
                    'advice': {'type': 'string'},
                },
                'required': ['category', 'fragment', 'advice'],
                'additionalProperties': False,
            },
            'maxItems': 8,
        },
    },
    'required': ['overall', 'scores', 'strengths', 'nextSteps', 'issues'],
    'additionalProperties': False,
}

system = '''You are an educational writing assessor for Primary 6 students in Hong Kong.
Assess the student's own English writing for formative learning only. Be encouraging and age-appropriate.
Do not rewrite the essay, do not produce replacement paragraphs, and do not infer personal information.
Use the same rubric for every sample: Ideas & Voice, Structure, Language, Revision, each 0-20.
The overall score must equal the sum of the four rubric scores, scaled to 100: sum * 1.25, rounded to nearest integer.
Identify only actionable issues. Quote short fragments only. If a sentence is acceptable, do not invent an error.
Return JSON only according to the supplied schema.'''

client = OpenAI()
results = []
for path in sorted(SAMPLE_DIR.glob('p6-*.txt')):
    raw = path.read_text(encoding='utf-8')
    sample_code = raw.splitlines()[0].split(':', 1)[1].strip()
    title = raw.splitlines()[2].split(':', 1)[1].strip()
    essay = raw.split('\n\n', 1)[1]
    response = client.chat.completions.create(
        model='gpt-5-mini',
        messages=[
            {'role': 'system', 'content': system},
            {'role': 'user', 'content': f'Sample code: {sample_code}\nTitle: {title}\nEssay:\n{essay}'},
        ],
        response_format={
            'type': 'json_schema',
            'json_schema': {'name': 'p6_writing_evaluation', 'strict': True, 'schema': schema},
        },
        max_completion_tokens=1800,
    )
    result = json.loads(response.choices[0].message.content)
    result['sampleCode'] = sample_code
    result['title'] = title
    results.append(result)

OUT.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(results, ensure_ascii=False, indent=2))
