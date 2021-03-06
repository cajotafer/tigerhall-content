import * as React from "react";
import debounce from "lodash.debounce";
import { useLazyQuery } from "@apollo/client";
import {
  Heading,
  Stack,
  SimpleGrid,
  SlideFade,
  Button,
} from "@chakra-ui/react";

import type { Podcast } from "../lib/graphql/generated/Podcast";
import { ALL_PODCAST_CARDS } from "../lib/graphql/AllPodcastCards";
import { pushHistoryState } from "../lib/index";
import { SearchForm } from "../components/SearchForm";
import { ContentCard } from "../components/ContentCard";
import { ContentCardSkeleton } from "../components/ContentCard/Skeleton";
import { Toast } from "../components/Toast";

interface ContentCardsVars {
  limit: number;
  offset: number;
  keywords: string;
}

interface ContentCardsResponse {
  contentCards: {
    edges: Podcast[];
  };
}

const CARDS_LIMIT = 20;

function Index() {
  const [keywordsToSearch, setKeywordsToSearch] = React.useState("");
  const [offset, setOffset] = React.useState(0);

  const [loadSearchResults, { called, loading, data, error, fetchMore }] =
    useLazyQuery<ContentCardsResponse, ContentCardsVars>(ALL_PODCAST_CARDS, {
      variables: {
        limit: CARDS_LIMIT + offset,
        offset,
        keywords: keywordsToSearch,
      },
    });

  function handleLoadMore() {
    const newOffset = offset + CARDS_LIMIT;
    fetchMore({
      variables: {
        limit: CARDS_LIMIT + newOffset,
        offset: newOffset,
      },
    });
    setOffset(newOffset);
  }

  const debouncedSearch = React.useCallback(
    debounce((value: string) => {
      setOffset(0);
      setKeywordsToSearch(value);
      pushHistoryState({ keywords: value });
    }, 300),
    []
  );

  // triggers the search query when the `keywordsToSearch` state changes
  React.useEffect(() => {
    loadSearchResults();

    return () => {
      // abort any request when unmounting
      const controller = new AbortController();
      controller.abort();
      debouncedSearch.cancel();
    };
  }, [keywordsToSearch, debouncedSearch, loadSearchResults]);

  return (
    <Stack
      as="main"
      alignItems="center"
      justifyContent="flex-start"
      height="100%"
      minH="100vh"
      padding={5}
      spacing={{ base: 4, md: 5 }}
    >
      <Stack as="header" spacing={1} w="full" maxW={{ base: 276, md: 480 }}>
        <Heading as="h1" id="search-label" size="xs" lineHeight="5">
          Search
        </Heading>
        <SearchForm
          isBusy={called && loading}
          search={debouncedSearch}
          aria-labelledby="search-label"
        />
      </Stack>
      <SlideFade in offsetY={50} delay={0.5}>
        <SimpleGrid
          as="section"
          columns={{ base: 1, md: 2, lg: 3, xl: 4 }}
          px={{ base: 0, sm: 10 }}
          maxW="container.xl"
          spacing={{ base: "10px", md: "20px" }}
        >
          {data
            ? data.contentCards.edges.map((contentCard, i) => {
                return (
                  <ContentCard
                    key={contentCard.name}
                    name={contentCard.name}
                    image={contentCard.image}
                    categories={contentCard.categories}
                    experts={contentCard.experts}
                    // first 4 images load faster
                    imageLoading={i < 4 ? "eager" : "lazy"}
                  />
                );
              })
            : Array(CARDS_LIMIT + offset)
                .fill(1)
                .map((_, i) => <ContentCardSkeleton key={i} />)}
        </SimpleGrid>
      </SlideFade>
      <Button
        bgColor="orange.600"
        borderRadius={5}
        size="sm"
        onClick={handleLoadMore}
        _active={{
          bgColor: "orange.700",
        }}
        _hover={{
          bgColor: "orange.500",
        }}
      >
        Load more
      </Button>
      {error ? (
        <Toast
          title="Ups! something happened."
          description={`Please, reload the page: ${error?.message}`}
          status="error"
          duration={9000}
          isClosable
        />
      ) : null}
    </Stack>
  );
}
export default Index;
