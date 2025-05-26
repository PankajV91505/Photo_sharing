import os
from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename
from models import db, Photo, Tag
from forms import PhotoForm
from config import Config
from flask_wtf.csrf import CSRFProtect

app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)
csrf = CSRFProtect(app)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

@app.route('/')
def index():
    photos = Photo.query.order_by(Photo.created_at.desc()).all()
    form = PhotoForm()
    return render_template('index.html', photos=photos, form=form)

@app.route('/upload', methods=['POST'])
def upload():
    form = PhotoForm()
    if form.validate_on_submit():
        file = form.image.data
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            
            
            photo = Photo(
                title=form.title.data,
                description=form.description.data,
                image_path=filename
            )
            
            
            if form.tags.data:
                tag_names = [t.strip() for t in form.tags.data.split(',')]
                for tag_name in tag_names:
                    if tag_name:  
                        tag = Tag.query.filter_by(name=tag_name).first()
                        if not tag:
                            tag = Tag(name=tag_name)
                            db.session.add(tag)
                        photo.tags.append(tag)
            
            db.session.add(photo)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'photo': {
                    'id': photo.id,
                    'title': photo.title,
                    'description': photo.description,
                    'image_path': photo.image_path,
                    'tags': [tag.name for tag in photo.tags]
                }
            })
    return jsonify({'success': False, 'errors': form.errors}), 400

@app.route('/photo/<int:id>/update', methods=['PUT'])
def update_photo(id):
    photo = Photo.query.get_or_404(id)
    data = request.json
    
    if data.get('title'):
        photo.title = data['title']
    if data.get('description') is not None:  
        photo.description = data['description']
    
    if data.get('tags') is not None:
        photo.tags.clear()
        tag_names = [t.strip() for t in data['tags'].split(',')]
        for tag_name in tag_names:
            if tag_name:  
                tag = Tag.query.filter_by(name=tag_name).first()
                if not tag:
                    tag = Tag(name=tag_name)
                    db.session.add(tag)
                photo.tags.append(tag)
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'photo': {
            'id': photo.id,
            'title': photo.title,
            'description': photo.description,
            'image_path': photo.image_path,
            'tags': [tag.name for tag in photo.tags]
        }
    })

@app.route('/photo/<int:id>/delete', methods=['DELETE'])
def delete_photo(id):
    photo = Photo.query.get_or_404(id)
    
    if os.path.exists(os.path.join(app.config['UPLOAD_FOLDER'], photo.image_path)):
        os.remove(os.path.join(app.config['UPLOAD_FOLDER'], photo.image_path))
    
    db.session.delete(photo)
    db.session.commit()
    return jsonify({'success': True})

@app.route('/search')
def search_photos():
    tag = request.args.get('tag')
    if not tag:
        return jsonify([])

    photos = Photo.query.join(Photo.tags).filter(Tag.name.ilike(f'%{tag}%')).all()

    result = []
    for photo in photos:
        result.append({
            'id': photo.id,
            'title': photo.title,
            'description': photo.description,
            'image_path': photo.image_path,
            'tags': [t.name for t in photo.tags]
        })

    return jsonify(result)

@app.route('/photo/<int:id>', methods=['GET'])
def get_photo(id):
    photo = Photo.query.get_or_404(id)
    return jsonify({
        'id': photo.id,
        'title': photo.title,
        'description': photo.description,
        'image_path': photo.image_path,
        'tags': [tag.name for tag in photo.tags]
    })
@app.route('/photo/<int:photo_id>/edit', methods=['POST'])
def edit_photo(photo_id):
    photo = Photo.query.get_or_404(photo_id)

    try:
        data = request.get_json()

        photo.title = data.get('title', photo.title)
        photo.description = data.get('description', photo.description)

        tag_names = [t.strip() for t in data.get('tags', '').split(',') if t.strip()]
        new_tags = []
        for name in tag_names:
            tag = Tag.query.filter_by(name=name).first()
            if not tag:
                tag = Tag(name=name)
                db.session.add(tag)
            new_tags.append(tag)

        photo.tags = new_tags

        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
