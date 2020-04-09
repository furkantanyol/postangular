import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';

import { Post } from './post.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PostService {
  private posts: Post[] = [];
  private postsUpdated = new Subject<{ posts: Post[]; postCount: number }>();

  constructor(private httpClient: HttpClient, private router: Router) {}

  getPostUpdateListener() {
    return this.postsUpdated.asObservable();
  }

  getPost(id: string) {
    return this.httpClient.get<{
      message: string;
      post: {
        _id: string;
        title: string;
        content: string;
        imagePath: string;
        creator: string;
      };
    }>(environment.apiUrl + '/posts/' + id);
  }

  getPosts(postsPerPage: number, currentPage: number) {
    const queryParams = `?pageSize=${postsPerPage}&page=${currentPage}`;
    this.httpClient
      .get<{ message: string; posts: any; maxPosts: number }>(
        environment.apiUrl + '/posts' + queryParams
      )
      .pipe(
        map((postData) => {
          const postsDataWithUpdatedId = postData.posts.map(
            (post: {
              _id: string;
              title: string;
              content: string;
              imagePath: string;
              creator: string;
            }) => {
              const updatedPostData = {
                title: post.title,
                content: post.content,
                id: post._id,
                imagePath: post.imagePath,
                creator: post.creator,
              };

              return updatedPostData;
            }
          );

          const { maxPosts } = postData;

          return { posts: postsDataWithUpdatedId, maxPosts };
        })
      )
      .subscribe((transformedPostsData) => {
        console.log(transformedPostsData);
        this.posts = transformedPostsData.posts;
        this.postsUpdated.next({
          posts: [...this.posts],
          postCount: transformedPostsData.maxPosts,
        });
      });
  }

  addPost(title: string, content: string, image: File) {
    const postData = new FormData();
    postData.append('title', title);
    postData.append('content', content);
    postData.append('image', image, title);

    this.httpClient
      .post<{ message: string; post: Post }>(
        environment.apiUrl + '/posts',
        postData
      )
      .subscribe((responseData) => {
        this.router.navigate(['/']);
      });
  }

  updatePost(id: string, title: string, content: string, image: File | string) {
    let postData: Post | FormData;
    if (typeof image == 'string') {
      postData = {
        id,
        title,
        content,
        imagePath: image,
        creator: null,
      };
    } else {
      postData = new FormData();
      postData.append('id', id);
      postData.append('title', title);
      postData.append('content', content);
      postData.append('image', image, title);
    }
    this.httpClient
      .put<{ message: string }>(environment.apiUrl + '/posts/' + id, postData)
      .subscribe((responseData) => {
        this.router.navigate(['/']);
      });
  }

  deletePost(postId: string) {
    return this.httpClient.delete<{ message: string }>(
      environment.apiUrl + '/posts/' + postId
    );
  }
}
