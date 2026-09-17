"""Build offline, continent-scale PBDB summaries. Network only with --refresh."""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import gzip
import hashlib
import json
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'data' / 'dinosaurs'
REGIONS = [('AFR', '非洲', 1), ('SOA', '南美洲', 2), ('NOA', '北美洲', 3),
           ('AUS', '澳大利亚', 4), ('ATA', '南极洲', 5), ('ASI', '亚洲主体', 9),
           ('IND', '印度', 6), ('EUR', '欧洲', 8)]
AGES = [220, 200, 170, 150, 120, 105, 90]


def query_url(code):
    # India travelled separately from Eurasia during the displayed dinosaur eras.
    countries = 'IN,PK,BD,LK,NP,BT'
    region = countries if code == 'IND' else ('ASI,^' + ',^'.join(countries.split(',')) if code == 'ASI' else code)
    return 'https://paleobiodb.org/data1.2/occs/list.json?' + urlencode({
        'base_name': 'Dinosauria^Aves', 'cc': region, 'min_ma': 66, 'max_ma': 235,
        'idreso': 'genus', 'idqual': 'genus_certain', 'rowcount': 'yes', 'limit': 'all'})


def refresh(region):
    code = region[0]
    with urlopen(query_url(code), timeout=60) as response:
        raw = response.read()
    payload = json.loads(raw)
    if payload.get('errors') or payload.get('warnings') or 'records' not in payload:
        raise ValueError(f'{code}: invalid response: {str(payload)[:500]}')
    count = len(payload['records'])
    if int(payload['records_found']) != count:
        raise ValueError(f'{code}: truncated response')
    (SOURCE / (code + '.json.gz')).write_bytes(gzip.compress(raw, mtime=0))
    print(f'{code}: downloaded {count} records', flush=True)


def matches(record, age):
    """Overlap a +/-5 Ma window; omit unresolved ages and spans wider than 30 Ma."""
    try:
        old, young = float(record['eag']), float(record['lag'])
    except (KeyError, TypeError, ValueError):
        return False
    return 66 <= young <= old <= 235 and old - young <= 30 and old >= age - 5 and young <= age + 5


def build():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--refresh', action='store_true', help='Download fresh PBDB snapshots (requires internet)')
    args = parser.parse_args()
    SOURCE.mkdir(parents=True, exist_ok=True)
    if args.refresh:
        with ThreadPoolExecutor(max_workers=3) as pool:
            list(pool.map(refresh, REGIONS))
        (SOURCE / 'downloaded-at.txt').write_text(datetime.now(timezone.utc).isoformat() + '\n', encoding='utf-8')
    anchors = json.loads((ROOT / 'data/label-candidates/paleomap-reference-points.json').read_text(encoding='utf-8'))
    anchors = {p['id']: p for p in anchors['labels']}
    evidence = {'downloaded_at': (SOURCE / 'downloaded-at.txt').read_text().strip(),
                'taxon': 'Dinosauria^Aves', 'license': 'CC BY 4.0', 'sources': [], 'eras': {}}
    snapshots = {}
    for code, _, _ in REGIONS:
        raw = gzip.decompress((SOURCE / (code + '.json.gz')).read_bytes())
        snapshots[code] = json.loads(raw)['records']
        evidence['sources'].append({'region': code, 'url': query_url(code),
                                    'sha256': hashlib.sha256(raw).hexdigest(), 'records': len(snapshots[code])})
    runtime = {}
    for age in AGES:
        labels, regions = [], []
        for code, name, seed in REGIONS:
            records = [r for r in snapshots[code] if matches(r, age)]
            if not records:
                continue
            anchor = anchors[f'{age}-{seed}']
            # One schematic anchor per modern continental group, not the fossil's location.
            labels.append({'name': '◆ 恐龙·' + name + '陆块', 'kind': 'fossil',
                           'lon': round(anchor['lon'], 2), 'lat': round(anchor['lat'], 2)})
            regions.append({'region': code, 'name': name, 'occurrences': len(records),
                            'collections': len({r['cid'] for r in records}),
                            'sample_occurrences': [r['oid'] for r in records[:5]],
                            'sample_references': sorted({r['rid'] for r in records[:5]}),
                            'anchor_id': anchor['id'], 'anchor_status': anchor['status']})
        runtime[age] = {'older_ma': age + 5, 'younger_ma': age - 5, 'labels': labels}
        evidence['eras'][age] = regions
        print(f'{age} Ma: {len(labels)} continental regions')
    (SOURCE / 'evidence.json').write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    header = ('// Offline schematic regions, NOT fossil coordinates or range boundaries.\n'
              '// PBDB contributors, CC BY 4.0: https://paleobiodb.org/ | https://creativecommons.org/licenses/by/4.0/\n'
              '// Anchors: Christopher R. Scotese, PALEOMAP (2016), CC BY 4.0, https://zenodo.org/records/10251792\n'
              '// Modified by grouping fossil records and assigning schematic anchors. See docs/dinosaur-distribution.md.\n')
    (ROOT / 'js/dinosaur-data.js').write_text(header + 'var DINOSAUR_DATA = ' +
                                            json.dumps(runtime, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')


if __name__ == '__main__':
    build()
