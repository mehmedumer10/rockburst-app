FROM public.ecr.aws/lambda/python:3.10

RUN pip install --upgrade pip --no-cache-dir

COPY requirements.txt requirements-catboost.txt ./

# LightGBM 3.3.5 has a pre-built manylinux wheel - zero compilation needed
RUN pip install lightgbm==3.3.5 --no-cache-dir

# Remaining dependencies
RUN pip install -r requirements.txt --no-cache-dir

# CatBoost without optional heavy deps
RUN pip install -r requirements-catboost.txt --no-deps --no-cache-dir

COPY app.py predictor.py ./
COPY models/ models/
COPY firebase-credentials.json .

CMD ["app.handler"]