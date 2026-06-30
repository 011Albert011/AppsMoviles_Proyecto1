import json, pathlib

path = pathlib.Path("angular.json")
data = json.loads(path.read_text(encoding="utf-8"))

budgets = data["projects"]["app"]["architect"]["build"]["configurations"]["production"]["budgets"]

clean = []
for b in budgets:
    t = b.get("type")
    if t == "initial":
        clean.append({"type": "initial", "maximumWarning": "2mb", "maximumError": "5mb"})
    elif t == "anyComponentStyle":
        clean.append({"type": "anyComponentStyle", "maximumWarning": "8kb", "maximumError": "12kb"})
    else:
        clean.append(b)

data["projects"]["app"]["architect"]["build"]["configurations"]["production"]["budgets"] = clean
path.write_text(json.dumps(data, indent=2), encoding="utf-8")
print("Budgets corregidos:", clean)
